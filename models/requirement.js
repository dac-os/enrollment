var VError, async, mongoose, jsonSelect, nconf, courses, calendar, history, Schema, schema;

VError = require('verror');
async = require('async');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
courses = require('dacos-courses-driver');
calendar = require('dacos-calendar-driver');
history = require('dacos-history-driver');
nconf = require('nconf');
Schema = mongoose.Schema;

schema = new Schema({
  'enrollment' : {
    'type'     : Schema.ObjectId,
    'ref'      : 'Enrollment',
    'required' : true
  },
  'discipline' : {
    'type'     : String,
    'required' : true
  },
  'offering'   : {
    'type'     : String,
    'required' : true
  },
  'status'     : {
    'type'    : String,
    'enum'    : [ 'new', 'approved', 'rejected', 'quit' ],
    'default' : 'new'
  },
  'comment'    : {
    'type' : String
  },
  'priority'   : {
    'type' : Number
  },
  'createdAt'  : {
    'type'    : Date,
    'default' : Date.now
  },
  'updatedAt'  : {
    'type' : Date
  }
}, {
  'collection' : 'requirements',
  'strict'     : true,
  'toJSON'     : {
    'virtuals' : true
  }
});

schema.index({
  'enrollment' : 1,
  'discipline' : 1,
  'offering'   : 1
}, {
  'unique' : true
});

schema.plugin(jsonSelect, {
  '_id'        : 0,
  'enrollment' : 1,
  'discipline' : 1,
  'offering'   : 1,
  'status'     : 1,
  'comment'    : 1,
  'priority'   : 1,
  'createdAt'  : 1,
  'updatedAt'  : 1
});

schema.pre('save', function setRequirementUpdatedAt(next) {
  'use strict';

  this.updatedAt = new Date();
  next();
});

/**
 * Calculates the priority score
 */
schema.pre('save', function setPriorityScore(next) {
  'use strict';

  async.waterfall([function (next) {
    this.populate('enrollment');
    this.populate(next);
  }.bind(this), function (_, next) {
    history.currentHistory(this.enrollment.user, next);
  }.bind(this), function (currentHistory, next) {
    courses.offering(this.discipline, this.offering, function (error, offering) {
      next(error, currentHistory, offering);
    }.bind(this));
  }.bind(this), function (currentHistory, offering, next) {
    courses.blocks(currentHistory.year, currentHistory.course + '-' + currentHistory.modality, function (error, blocks) {
      next(error, currentHistory, offering, blocks);
    }.bind(this));
  }.bind(this), function (currentHistory, offering, blocks, next) {
    var blockType, isAhead, isReserved;

    blockType = 'extra';
    isAhead = false;
    isReserved = false;

    async.some(blocks, function (block, next) {
      courses.requirement(currentHistory.year, currentHistory.course + '-' + currentHistory.modality, block.code, this.discipline, function (error, requirement) {
        if (requirement) {
          var currentDate, currentSemester, offeringReservations, userSemester;
          
          currentDate = new Date();

          if (currentDate.getMonth() < 6) {
            currentSemester = 1;
          } else if (currentDate.getMonth() > 6) {
            currentSemester = 2;
          } else {
            currentSemester = currentDate.getDay() < 15 ? 1 : 2;
          }

          userSemester = (currentDate.getFullYear() - currentHistory.year) * 2 + currentSemester;
          offeringReservations = offering && offering.reservations || [];

          blockType = block.type;
          isAhead = offeringReservations.some(function (offeringReservation) {
            return ((offeringReservation.course.code === currentHistory.course)
              && (offeringReservation.yearCatalog && offeringReservation.yearCatalog > currentHistory.year));
          });

          isReserved = requirement && (userSemester < requirement.suggestedSemester);

          next(true);
        }
        else {
          next(false);
        }
      }.bind(this));
    }.bind(this), function (_) {
      next(null, blockType, isAhead, isReserved);
    });
  }.bind(this), function (blockType, isAhead, isReserved, next) {
    var priorityScore;

    // Calculating priority score
    if (blockType === 'required') {
      // Obligatory discipline
      if (isAhead) {
        if (isReserved) {
          priorityScore = 6;
        } else {
          priorityScore = 3;
        }
      } else {
        if (isReserved) {
          priorityScore = 9;
        } else {
          priorityScore = 7;
        }
      }
    } else if (blockType === 'optional') {
      // Optional discipline
      if (isAhead) {
        if (isReserved) {
          priorityScore = 5;
        } else {
          priorityScore = 2;
        }
      } else {
        if (isReserved) {
          priorityScore = 8;
        } else {
          priorityScore = 4;
        }
      }
    } else if (blockType === 'extra') {
      // Extra-curricular discipline
      if (isAhead) {
        if (isReserved) {
          priorityScore = 1;
        } else {
          priorityScore = 0;
        }
      } else {
        // TODO check why this is equal to the last conditional
        if (isReserved) {
          priorityScore = 1;
        } else {
          priorityScore = 0;
        }
      }
    }

    this.priority = priorityScore;
    //console.log(this.priority);
    next();
  }.bind(this)], next);
});

/**
 * Checks if a credit raise request should be oppened
 */
schema.pre('save', function openCreditRaiseRequestIfNecessary(next) {
  'use strict';

  async.waterfall([function (next) {
    this.populate('enrollment');
    this.populate(next);
  }.bind(this), function (_, next) {
    async.parallel({
      'requirements': function (next) {
        var query;
        query = this.model('Requirement').find();
        query.where('enrollment').equals(this.enrollment._id);
        query.where('_id').ne(this._id);
        query.exec(next);
      }.bind(this),
      'modality'   : function (next) {
        async.waterfall([function (next) {
          history.currentHistory(this.enrollment.user, next);
        }.bind(this), function (currentHistory, next) {
          courses.modality(currentHistory.year, currentHistory.course + '-' + currentHistory.modality, next);
        }.bind(this)], next);
      }.bind(this)
    }, next);
  }.bind(this), function (data, next) {
    // sum the actual requirement together with all other requirements
    data.requirements.push(this);

    async.reduce(data.requirements, 0, function (sum, disciplineRequirement, next) {
      courses.discipline(disciplineRequirement.discipline, function (error, discipline) {
        next(error, discipline ? discipline.credits + sum : 0);
      }.bind(this));
    }.bind(this), function (error, credits) {
      if (error) {
        error = new VError(error, 'Error when trying to sum the credits');
        return next(error);
      }

      if (credits <= data.modality.creditLimit) {
        return next();
      }

      this.enrollment.creditRaiseRequest.credits = credits;
      this.enrollment.creditRaiseRequest.date = new Date();
      this.enrollment.creditRaiseRequest.status = 'pending';
      this.enrollment.save(next);
    }.bind(this));
  }.bind(this)], next);
});

schema.path('offering').validate(function validateIfDisciplineOfferingExists(value, next) {
  'use strict';

  courses.offering(this.discipline, this.offering, function foundDisciplineOffering(error, offering) {
    next(!error && !!offering);
  });
}, 'discipline offering not found');

schema.path('discipline').validate(function validateDisciplineRequirement(value, next) {
  'use strict';

  async.waterfall([function (next) {
    this.populate('enrollment');
    this.populate(next);
  }.bind(this), function (_, next) {
    async.parallel({
      'discipline': function (next) {
        courses.discipline(this.discipline, next);
      }.bind(this),
      'histories' : function (next) {
        history.histories(this.enrollment.user, next);
      }.bind(this)
    }, next);
  }.bind(this), function (data, next) {
    async.every(data.histories, function (userHistory) {
      if (data.discipline.requirements.length > 0) {
        data.discipline.requirements.forEach(function (disciplineRequirement) {
          history.discipline(this.enrollment.user, userHistory.year, disciplineRequirement.code, function (error, disciplineHistory) {
            next(!!error || (disciplineHistory && [1, 2, 3, 4, 7, 10, 11, 12, 13, 14, 15, 16, 20].lastIndexOf(disciplineHistory.status) > -1));
          }.bind(this));
        }.bind(this));
      }
      else {
        next();
      }
    }.bind(this), next);
  }.bind(this)], next);
}, 'discipline requirement not fulfilled');

schema.path('status').validate(function validateIfRequirementCanBeQuit(value, next) {
  'use strict';
  var todayDate, year;
  todayDate = new Date();
  year = todayDate.getFullYear();

  if (this.status === 'quit') {
    calendar.betweenEvents(todayDate, year, 'discipline-quit-starts', year, 'discipline-quit-ends', next);
  }
  else {
    next();
  }
}, 'outside of discipline quit period');

schema.path('discipline').validate(function validateDisciplineApproval(value, next) {
  'use strict';

  async.waterfall([function (next) {
    this.populate('enrollment');
    this.populate(next);
  }.bind(this), function (_, next) {
    async.parallel({
      'histories'  : function (next) {
        history.histories(this.enrollment.user, next);
      }.bind(this),
      'discipline' : function (next) {
        courses.discipline(this.discipline, next);
      }.bind(this)
    }, next);
  }.bind(this), function (data, next) {
    async.every(data.histories, function (userHistory, next) {
      history.discipline(this.enrollment.user, userHistory.year, data.discipline.code, function (error, disciplineHistory) {
        next(!!error || !(disciplineHistory && [1, 2, 3, 4, 7, 10, 11, 12, 13, 14, 15, 16, 20].lastIndexOf(disciplineHistory.status) > -1));
      }.bind(this));
    }.bind(this), next);
  }.bind(this)], next);
}, 'user was already approved on discipline');

schema.path('offering').validate(function validateIfRequirementHasTimeConflict(value, next) {
  'use strict';

  async.waterfall([function (next) {
    this.populate('enrollment');
    this.populate(next);
  }.bind(this), function (_, next) {
    async.parallel({
      'offering'    : function (next) {
        courses.offering(this.discipline, this.offering, next);
      }.bind(this),
      'requirements': function (next) {
        var query;

        query = this.model('Requirement').find();
        query.where('enrollment').equals(this.enrollment._id);
        query.where('_id').ne(this._id);
        query.where('discipline').ne(this.discipline);
        query.exec(next);
      }.bind(this)
    }, next);
  }.bind(this), function (data, next) {
    async.every(data.requirements, function (requirement, next) {
      courses.offering(requirement.discipline, requirement.offering, function foundDisciplineOffering(error, offeringConflict) {
        var conflict = data.offering.schedules.some(function (schedule) {
          return offeringConflict.schedules.some(function (otherSchedule) {
            return (schedule.weekday === otherSchedule.weekday && schedule.hour === otherSchedule.hour);
          });
        });

        next(!!error || !conflict);
      });
    }.bind(this), next);
  }.bind(this)], next);
}, 'discipline with time conflict');

module.exports = mongoose.model('Requirement', schema);
