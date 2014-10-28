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

schema.pre('save', function setPriorityScore(next) {
  'use strict';

  var priorityScore;

  this.populate('enrollment');
  this.populate(function () {
    getDisciplineInformation(this.enrollment, this.discipline, this.offering, function (blockType, isAhead, isReserved) {

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
      console.log(this.priority);

      next();
    }.bind(this));
  }.bind(this));
});

function getDisciplineInformation(enrollment, discipline, disciplineOffering, next) {
  'use strict';

  var blockType , isAhead, isReserved;

  blockType = 'optional';
  isAhead = false;
  isReserved = false;

  history.currentHistory(enrollment.user, function (error, currentHistory) {

    if (error) {
      error = new VError(error, 'Error when trying to get the history');
      return next(error);
    }

    if (!currentHistory) {
      return next(false);
    }

    courses.blocks(currentHistory.year, currentHistory.course + ' ' + currentHistory.modality, function (error, blocks) {
      if (error) {
        return next('');
      }

      async.some(blocks, function(block) {

        courses.requirement(currentHistory.year, currentHistory.course + ' ' + currentHistory.modality, block.code, this.discipline, function (error, requirement) {
          if (requirement) {
            var currentDate = new Date();

            var currentSemester;
            if (currentDate.getMonth() < 6) {
              currentSemester = 1;
            } else if(currentDate.getMonth() > 6) {
              currentSemester = 2;
            } else {
              currentSemester = currentDate.getDay() < 15 ? 1 : 2;
            }

            //TODO figure out how to get the offering reservation

            var userSemester = (currentDate.getFullYear() - currentHistory.year) * 2 + currentSemester;
            //var offeringReservations = disciplineOffering && disciplineOffering.reservations || [];

            blockType = block.type;
            //isAhead = offeringReservations.some(function (offeringReservation) { return offeringReservation === historyId; });
            isReserved = requirement && (userSemester < requirement.suggestedSemester);

            //requirement.code

            next(true);
          }
          else {
            next(false);
          }
        });
      }, function(result) {
        next(blockType, isAhead, isReserved);
      });
    });
  });
}

/**
 * verifica se uma solicitação de aumento de limite de créditos deve ser aberta
 */
schema.pre('save', function openCreditRaiseRequestIfNecessary(next) {
  'use strict';

  this.populate('enrollment');
  this.populate(function () {
    var user = this.enrollment.user;
    history.currentHistory(user, function (error, currentHistory) {
      if (error) {
        error = new VError(error, 'Error when trying to get the history');
        return next(error);
      }

      if (!currentHistory) {
        return next(false);
      }

      courses.modality(currentHistory.year, currentHistory.course + '-' + currentHistory.modality, function (error, modality) {
        if (error) {
          error = new VError(error, 'Error when trying to get the modality');
          return next(error);
        }

        if (!modality) {
          return next(new VError(error, 'Modality not found'));
        }

        var query;
        query = this.model('Requirement').find();
        query.where('enrollment').equals(this.enrollment._id);
        query.where('_id').ne(this._id);
        query.exec(function foundRequirements(error, requirements) {
          requirements.push(this);

          async.reduce(requirements, 0, function (sum, disciplineRequirement, next) {
            courses.discipline(disciplineRequirement.discipline, function (error, discipline) {
              next(error, discipline ? discipline.credits + sum : 0);
            }.bind(this));
          }.bind(this), function (error, credits) {
            if (error) {
              error = new VError(error, 'Error when trying to sum the credits');
              return next(error);
            }

            if (credits > modality.creditLimit) {
              this.enrollment.creditRaiseRequest.credits = credits;
              this.enrollment.creditRaiseRequest.date = new Date();
              this.enrollment.creditRaiseRequest.status = 'pending';
              this.enrollment.save(next);
            }
            else {
              next();
            }
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
});

schema.path('offering').validate(function validateIfDisciplineOfferingExists(value, next) {
  'use strict';

  courses.offering(this.discipline, this.offering, function foundDisciplineOffering(error, offering) {
    next(!error && !!offering);
  });
}, 'discipline offering not found');

schema.path('discipline').validate(function validateDisciplineRequirement(value, next) {
  'use strict';

  // TODO check this validation
  courses.discipline(this.discipline, function (error, discipline) {
    if (error) {
      error = new VError(error, 'Error when trying to get the discipline');
      return next(error);
    }

    if (!discipline) {
      return next(false);
    }

    this.populate('enrollment');
    this.populate(function () {
      var user = this.enrollment.user;
      history.histories(user, function (error, histories) {
        if (error) {
          error = new VError(error, 'Error when trying to get the histories');
          return next(error);
        }

        if (!histories) {
          return next(false);
        }

        histories.forEach(function (userHistory) {
          if (discipline.requirements.length > 0) {
            discipline.requirements.forEach(function (disciplineRequirement) {
              history.discipline(user, userHistory.year, disciplineRequirement.code, function (error, disciplineHistory) {
                next(!error && !!disciplineHistory &&
                [1, 2, 3, 4, 7, 10, 11, 12, 13, 14, 15, 16, 20].lastIndexOf(disciplineHistory.status) > -1);
              }.bind(this));
            }.bind(this));
          }
          else {
            next();
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
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
  /*@TODO verificar se a disciplina ja não foi cursada*/

  courses.discipline(this.discipline, function (error, discipline) {
    if (error) {
      error = new VError(error, 'Error when trying to get the discipline');
      return next(error);
    }

    if (!discipline) {
      return next(false);
    }

    this.populate('enrollment');
    this.populate(function () {
      var user  = this.enrollment.user;
      history.histories(user, function (error, histories) {
        if (error) {
          error = new VError(error, 'Error when trying to get the histories');
          return next(error);
        }

        if (!histories) {
          return next(false);
        }


        async.reduce(histories, 0, function (sum, userHistory, next) {
          history.discipline(user, userHistory.year, discipline.code, function(error, disciplineHistory) {
            //console.log(user, discipline, error, disciplineHistory);


            /*
            if (error &&
            error !== ['Error: Nock: No match for request GET http://localhost/users/111111/histories/2014/disciplines/MC102 ']) { 
              console.log(error);
              error = new VError(error, 'Error when trying to get the discipline');
              return next(error);
            }
            */
            

            // If user was already approved on discipline, fail the validation.
            if (disciplineHistory && [1, 2, 3, 4, 7, 10, 11, 12, 13, 14, 15, 16, 20].lastIndexOf(disciplineHistory.status) > -1) {
              console.log('Triggering error: user already approved on discipline TEST');
              next(error, 1 + sum);
            } 
            else {
              next(error, sum);
            }
          }.bind(this));
        }.bind(this), function (error, sum) {
          console.log(sum);
          next(sum === 0)
        });
        /*histories.forEach(function (userHistory) {
          
          }.bind(this));
          next();
        }.bind(this));*/
      }.bind(this));
    }.bind(this));
  }.bind(this)); 
}, 'user was already approved on discipline');

schema.path('offering').validate(function validateIfRequirementHasTimeConflict(value, next) {
  'use strict';

  this.populate('enrollment');
  this.populate(function () {

    courses.offering(this.discipline, this.offering, function foundDisciplineOffering(error, offering) {
      if (error) {
        error = new VError(error, 'Error when trying to get the discipline offering');
        return next(error);
      }

      if (!offering) {
        return next(false);
      }

      var query;
      query = this.model('Requirement').find();
      query.where('enrollment').equals(this.enrollment._id);
      query.where('_id').ne(this._id);
      query.exec(function foundRequirements(error, requirements) {
        async.every(requirements, function (disciplineRequirement, next) {
          courses.offering(disciplineRequirement.discipline, disciplineRequirement.offering, function foundDisciplineOffering(error, offeringConflict) {
            if (error) {
              error = new VError(error, 'Error when trying to get discipline offering');
              return next(error);
            }

            if (!offeringConflict) {
              return next(false);
            }

            // throw an error with equal discipline in another validation
            if (offeringConflict.code == offering.code) {
              return next(true);
            }

            var conflict = offering.schedules.some(function (schedule) {
              return offeringConflict.schedules.some(function (otherSchedule) {
                return (schedule.weekday === otherSchedule.weekday && schedule.hour === otherSchedule.hour);
              });
            });

            next(!conflict);
          });
        }.bind(this), next);
      }.bind(this));
    }.bind(this));
  }.bind(this));
}, 'discipline with time conflict');

module.exports = mongoose.model('Requirement', schema);
