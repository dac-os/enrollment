/*globals describe, before, it, after*/
require('should');
var supertest, nock, nconf, app;

supertest = require('supertest');
nock = require('nock');
nconf = require('nconf');
app = require('../index.js');

nock(nconf.get('AUTH_URI'), {
  'reqheaders' : {'csrf-token' : 'adminToken'}
}).get('/users/me').times(Infinity).reply(200, {
  'academicRegistry' : '111111',
  'profile'          : {
    'name'        : 'admin',
    'slug'        : 'admin',
    'permissions' : ['changeRequirement', 'changeEnrollment']
  }
});

nock(nconf.get('AUTH_URI'), {
  'reqheaders' : {'csrf-token' : 'userToken'}
}).get('/users/me').times(Infinity).reply(200, {
  'academicRegistry' : '111112',
  'profile'          : {
    'name'        : 'user',
    'slug'        : 'user',
    'permissions' : []
  }
});

nock(nconf.get('AUTH_URI'), {
  'reqheaders' : {'csrf-token' : 'undefined'}
}).get('/users/me').times(Infinity).reply(404, {});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC102/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'       : 'MC102',
  'year'       : '2014',
  'period'     : '1',
  'schedules'  : [{
    'weekday' : 3,
    'hour'    : 14,
    'room'    : 'CC02'
  }, {
    'weekday' : 5,
    'hour'    : 16,
    'room'    : 'CC02'
  }]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC202/offerings/2014-1-B').times(Infinity).reply(200, {
  'code'       : 'MC202',
  'year'       : '2014',
  'period'     : '1',
  'schedules'  : [{
    'weekday' : 3,
    'hour'    : 14,
    'room'    : 'CC02'
  }, {
    'weekday' : 5,
    'hour'    : 16,
    'room'    : 'CC02'
  }]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC202/offerings/2014-1-F').times(Infinity).reply(404);


it('should raise server', function (done) {
  'use strict';

  var request;
  request = supertest(app);
  request = request.get('/');
  request.expect(200);
  request.end(done);
});