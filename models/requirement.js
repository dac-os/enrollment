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

schema.pre('save', function (next) {
  'use strict';
  /*@TODO Calcular a prioridade*/
  next();
});

/**
 * verifica se uma solicitação de aumento de limite de créditos deve ser aberta
 */
schema.pre('save', function openCreditRaiseRequestIfNecessary(next) {
  'use strict';

  this.populate('enrollment');
  this.populate(function () {
    var user = this.enrollment.user;
    history.histories(user, function (error, histories) {
      if (error) {
        error = new VError(error, 'Error when trying to get the history');
        return next(error);
      }

      if (!histories) {
        return next(false);
      }

      var currentHistory;

      currentHistory = histories.sort(function (a, b) {
        return a.year - b.year;
      }).pop();

      if (!currentHistory) {
        error = new VError(error, 'Current history not found');
        return next(error);
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


schema.pre('save', function (next) {
  'use strict';
  /*@TODO verificar se a disciplina ja não foi cursada*/
  next();
});

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
        //console.log(requirements)
        async.reduce(requirements, 0, function (sum, disciplineRequirement, next) {d
          courses.discipline(disciplineRequirement.discipline, function (error, discipline) {
            courses.offering(discipline.discipline, discipline.offering, function foundDisciplineOffering(error, offeringConflict) {
              if (error) {
                error = new VError(error, 'Error when trying to get discipline offering');
                return next(error);
              }

              if (!offeringConflict) {
                return next(false);
              }


              var conflict = offering.schedules.some(function (schedule) {
                return offeringConflict.schedules.some(function (otherSchedule) {
                  return (schedule.weekday === otherSchedule.weekday && schedule.hour === otherSchedule.hour);
                });
              });

              if (conflict) {
                console.log(offering)
                console.log(offeringConflict)
              }

              next(!error, conflict ? 1 + sum : sum);
            });

          }.bind(this));
        }.bind(this), function (error, conflicts) {
          console.log(conflicts);
          next(!error && conflicts > 0);
        }.bind(this));
      }.bind(this));
    }.bind(this));



  }.bind(this));

  /*@TODO verificar se não existe conflito de horário*/
});

module.exports = mongoose.model('Requirement', schema);
