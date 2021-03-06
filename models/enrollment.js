var VError, mongoose, jsonSelect, nconf, async, courses, calendar, history, Schema, schema;

VError = require('verror');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
nconf = require('nconf');
async = require('async');
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

schema.pre('remove', function deleteCascadeRequirements(next) {
  'use strict';

  async.waterfall([function (next) {
    var Requirement, query;
    Requirement = require('./requirement');
    query = Requirement.find();
    query.where('enrollment').equals(this._id);
    query.exec(next);
  }.bind(this), function (requirements, next) {
    async.each(requirements, function (requirement, next) {
      requirement.remove(next);
    }.bind(this), next);
  }.bind(this)], next);
});

schema.path('createdAt').validate(function validateIfEnrollmentCanBeCreated(value, next) {
  'use strict';
  var todayDate, year;
  todayDate = new Date();
  year = todayDate.getFullYear();

  if (this.status !== 'cancelled') {
    calendar.betweenEvents(todayDate, year, 'enrollment-starts', year, 'enrollment-ends', next);
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
    calendar.betweenEvents(todayDate, year, 'cancellation-starts', year, 'cancellation-ends', next);
  }
  else {
    next();
  }
}, 'outside of enrollment cancellation period');

module.exports = mongoose.model('Enrollment', schema);