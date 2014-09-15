var VError, mongoose, jsonSelect, nconf, Schema, schema;

VError = require('verror');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
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
    'type'     : String,
    'enum'     : [ 'new', 'approved', 'rejected' ],
    'default'  : 'new'
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
  /*@TODO calcular a priridade*/
  next();
});

schema.pre('save', function (next) {
  'use strict';
  /*@TODO verificar se disciplina e oferecimento existem*/
  next();
});

schema.pre('save', function (next) {
  'use strict';
  /*@TODO detectar se pré requisitos são preenchidos*/
  next();
});

schema.pre('save', function (next) {
  'use strict';
  /*@TODO verificar se a disciplina ja não foi cursada*/
  next();
});

schema.pre('save', function (next) {
  'use strict';
  /*@TODO verificar se não existe conflito de horário*/
  next();
});

module.exports = mongoose.model('Requirement', schema);