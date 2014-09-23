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
  next();
});

schema.pre('save', function (next) {
  'use strict';
  /*@TODO verificar se ainda é possivel realizar matricula*/
  next();
});

schema.pre('remove', function (next) {
  'use strict';
  /*@TODO verificar se ainda é possivel realizar trancamento*/
  next();
});

module.exports = mongoose.model('Enrollment', schema);