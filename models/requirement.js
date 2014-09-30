var VError, mongoose, jsonSelect, nconf, courses, history, Schema, schema;

VError = require('verror');
mongoose = require('mongoose');
jsonSelect = require('mongoose-json-select');
courses = require('dacos-courses-driver');
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
    'enum'    : [ 'new', 'approved', 'rejected' ],
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
          discipline.requirements.forEach(function (disciplineRequirement) {
            history.discipline(user, userHistory.year, disciplineRequirement.code, function (error, disciplineHistory) {
              next(!error && !!disciplineHistory &&
              [1, 2, 3, 4, 7, 10, 11, 12, 13, 14, 15, 16, 20].lastIndexOf(disciplineHistory.status) > -1);
            }.bind(this));
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
}, 'discipline requirement not fulfilled');


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
