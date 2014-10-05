var VError, mongoose, jsonSelect, nconf, courses, calendar, history, Schema, schema;

VError = require('verror');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
nconf = require('nconf');
courses = require('dacos-courses-driver');
calendar = require('dacos-calendar-driver');
history = require('dacos-history-driver');
Schema = mongoose.Schema;

schema = new Schema({
  'user'               : {
    'type'     : String,
    'required' : true
  },
  'year'               : {
    'type'     : Number,
    'required' : true
  },
  'period'             : {
    'type'     : String,
    'required' : true
  },
  'status'             : {
    'type'    : String,
    'enum'    : [ 'new', 'processed' ],
    'default' : 'new'
  },
  'creditRaiseRequest' : {
    'credits'       : {
      'type' : Number,
      'min'  : 0
    },
    'date'          : {
      'type' : Date
    },
    'justification' : {
      'type' : String
    },
    'status'        : {
      'type' : String,
      'enum' : [ 'pending', 'rejected', 'approved' ]
    }
  },
  'createdAt'          : {
    'type'    : Date,
    'default' : Date.now
  },
  'updatedAt'          : {
    'type' : Date
  }
}, {
  'collection' : 'enrollments',
  'strict'     : true,
  'toJSON'     : {
    'virtuals' : true
  }
});

schema.index({
  'user'   : 1,
  'year'   : 1,
  'period' : 1
}, {
  'unique' : true
});

schema.plugin(jsonSelect, {
  '_id'                : 0,
  'user'               : 0,
  'year'               : 1,
  'period'             : 1,
  'type'               : 1,
  'status'             : 1,
  'drop'               : 1,
  'creditRaiseRequest' : 1,
  'createdAt'          : 1,
  'updatedAt'          : 1
});

schema.pre('save', function setEnrollmentUpdatedAt(next) {
  'use strict';

  this.updatedAt = new Date();
  next();
});

schema.pre('save', function (next) {
  'use strict';
  /*@TODO verificar se uma solicitação de aumento de limite de créditos deve ser aberta*/
  var creditsLimit, year;

  var userId = this.user;
  history.histories(userId, function (error, histories) {
    if (error) { return next(error); }

    var currentHistory;

    currentHistory = histories.sort(function (a, b) {
      return a.year - b.year;
    }).pop();

    if (!currentHistory) { return next(new Error('history not found')); }

    year = currentHistory.year;

    courses.catalog(year, function (error, catalog) {
      if (error) { return next(error); }
      if (!catalog) { return next(new VError(error, 'catalog not found')); }
      creditsLimit = catalog.credits.maximum;
      async.reduce(this.disciplines, 0, function (sum, discipline, next) {
        courses.discipline({'discipline' : discipline.discipline}, function (error, discipline) {
          next(error, discipline ? discipline.credits + sum : 0);
        });
      }, function (error, credits) {
        if (error) { return next(error); }
        if (credits > creditsLimit) {
          this.creditRaiseRequest.credits = credits;
          this.creditRaiseRequest.date = new Date();
        }
        next();
      }.bind(this));
    }.bind(this));
  }.bind(this));
  next();
});

schema.path('createdAt').validate(function validateIfEnrollmentCanBeCreated(value, next) {
  'use strict';
  var todayDate = new Date();
  var year = todayDate.getFullYear();
  calendar.event(year, 'enrollment-starts', function (error, enrollmentStartEvent) {
    if (error) {
      error = new VError(error, 'Error when trying to get the calendar event');
      next(error);
    }

    calendar.event(year, 'enrollment-ends', function (error, enrollmentEndEvent) {
      if (error) {
        error = new VError(error, 'Error when trying to get the calendar event');
        next(error);
      }

      next(
          !error && !!enrollmentStartEvent && !!enrollmentEndEvent &&
          new Date(enrollmentStartEvent.date) <= todayDate &&
          todayDate < new Date(enrollmentEndEvent.date)
      );
    }.bind(this));
  }.bind(this));


}, 'outside the enrollment period');

schema.pre('remove', function (next) {
  'use strict';
  /*@TODO verificar se ainda é possivel realizar trancamento*/
  next();
});

module.exports = mongoose.model('Enrollment', schema);