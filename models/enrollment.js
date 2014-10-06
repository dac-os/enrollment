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
    'enum'    : [ 'new', 'processed' , 'cancelled' ],
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

schema.path('createdAt').validate(function validateIfEnrollmentCanBeCreated(value, next) {
  'use strict';
  var todayDate, year;
  todayDate = new Date();
  year = todayDate.getFullYear();

  if (this.status !== 'cancelled') {
    betweenEvents(todayDate, year, 'enrollment-starts', year, 'enrollment-ends', next);
  }
  else {
    next();
  }
}, 'outside the enrollment period');

schema.path('status').validate(function validateIfEnrollmentCanBeCanceled(value, next) {
  'use strict';
  var todayDate, year;
  todayDate = new Date();
  year = todayDate.getFullYear();

  if (this.status === 'cancelled') {
    betweenEvents(todayDate, year, 'cancellation-starts', year, 'cancellation-ends', next);
  }
  else {
    next();
  }
}, 'outside of enrollment cancellation period');

/**
 * Validates if a date is between two events in the calendar
 * @param todayDate
 * @param yearEventBefore
 * @param idEventBefore
 * @param yearEventAfter
 * @param idEventAfter
 * @param next
 */
function betweenEvents(todayDate, yearEventBefore, idEventBefore, yearEventAfter, idEventAfter, next) {
  'use strict';

  calendar.event(yearEventBefore, idEventBefore, function (error, enrollmentStartEvent) {
    if (error) {
      error = new VError(error, 'Error when trying to get the calendar event');
      next(error);
    }

    calendar.event(yearEventAfter, idEventAfter, function (error, enrollmentEndEvent) {
      if (error) {
        error = new VError(error, 'Error when trying to get the calendar event');
        next(error);
      }

      next(!error && !!enrollmentStartEvent && !!enrollmentEndEvent &&
        new Date(enrollmentStartEvent.date) <= todayDate &&
        todayDate < new Date(enrollmentEndEvent.date));
    }.bind(this));
  }.bind(this));
}

module.exports = mongoose.model('Enrollment', schema);