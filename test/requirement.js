/*globals describe, before, beforeEach, it, after*/
require('should');
var supertest, app, timekeeper, Requirement, referenceDate, Enrollment;

supertest = require('supertest');
app = require('../index.js');
timekeeper = require('timekeeper');
Requirement = require('../models/requirement');
Enrollment = require('../models/enrollment');
referenceDate = new Date(2014, 6, 11);

describe('requirement controller', function () {
  'use strict';

  before(Enrollment.remove.bind(Enrollment));

  before(function(done) {
    timekeeper.travel(referenceDate);
    done();
  });

  before(function (done) {
    var request;
    request = supertest(app);
    request = request.post('/users/111111/enrollments');
    request.set('csrf-token', 'adminToken');
    request.send({'year' : 2014});
    request.send({'period' : '1'});
    request.end(done);
  });

  describe('create', function () {
    before(Requirement.remove.bind(Requirement));

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.send({'discipline' : 'MC102'});
      request.send({'offering' : '2014-1-A'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeRequirement permission', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'userToken');
      request.send({'discipline' : 'MC102'});
      request.send({'offering' : '2014-1-A'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without discipline', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'offering' : '2014-1-A'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('discipline').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without offering', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC102'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('offering').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without discipline and offering', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('discipline').be.equal('required');
        response.body.should.have.property('offering').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error when offering not found', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC202'});
      request.send({'offering' : '2014-1-F'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('offering').be.equal('discipline offering not found');
      });
      request.end(done);
    });

    it('should raise error when discipline requirement is not fulfilled', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC302'});
      request.send({'offering' : '2014-1-B'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('discipline').be.equal('discipline requirement not fulfilled');
      });
      request.end(done);
    });

    it('should raise error when user was already approved on discipline', function(done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'CE738'});
      request.send({'offering' : '2014-1-A'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('discipline').be.equal('user was already approved on discipline');
      });
      request.end(done);
    });
    it('should create', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC102'});
      request.send({'offering' : '2014-1-A'});
      request.expect(201);
      request.end(done);
    });

    describe('with credit raise request', function () {
      before(Requirement.remove.bind(Requirement));

      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC102'});
        request.send({'offering' : '2014-1-A'});
        request.end(done);
      });

      it('should not have a credit raise request', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.expect(200);
        request.expect(function (response) {
          response.body.should.not.have.property('creditRaiseRequest');
        });
        request.end(done);
      });

      it('should create with a credit raise request', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MA111'});
        request.send({'offering' : '2014-1-A'});
        request.expect(201);
        request.end(done);
      });

      it('should have a credit raise request', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.expect(200);
        request.expect(function (response) {
          response.body.creditRaiseRequest.should.have.property('credits').be.equal(12);
          response.body.creditRaiseRequest.should.have.property('status').be.equal('pending');
        });
        request.end(done);
      });
    });

    describe('with code taken', function () {
      before(Requirement.remove.bind(Requirement));

      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC102'});
        request.send({'offering' : '2014-1-A'});
        request.end(done);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC102'});
        request.send({'offering' : '2014-1-A'});
        request.expect(409);
        request.end(done);
      });
    });
  });

  describe('list', function () {
    before(Requirement.remove.bind(Requirement));

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC102'});
      request.send({'offering' : '2014-1-A'});
      request.end(done);
    });

    it('should list', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/users/111111/enrollments/2014-1/requirements');
      request.expect(200);
      request.expect(function (response) {
        response.body.should.be.instanceOf(Array).with.lengthOf(1);
        response.body.every(function (requirement) {
          requirement.should.have.property('discipline');
          requirement.should.have.property('offering');
        });
      });
      request.end(done);
    });

    it('should return empty in second page', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/users/111111/enrollments/2014-1/requirements');
      request.send({'page' : 1});
      request.expect(200);
      request.expect(function (response) {
        response.body.should.be.instanceOf(Array).with.lengthOf(0);
      });
      request.end(done);
    });
  });

  describe('details', function () {
    before(Requirement.remove.bind(Requirement));

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC102'});
      request.send({'offering' : '2014-1-A'});
      request.end(done);
    });

    it('should raise error with invalid code', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/users/111111/enrollments/2014-1/requirements/invalid');
      request.expect(404);
      request.end(done);
    });

    it('should show', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.expect(200);
      request.expect(function (response) {
        response.body.should.have.property('discipline').be.equal('MC102');
        response.body.should.have.property('offering').be.equal('2014-1-A');
      });
      request.end(done);
    });
  });

  describe('update', function () {
    before(Requirement.remove.bind(Requirement));

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC102'});
      request.send({'offering' : '2014-1-A'});
      request.end(done);
    });

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.send({'discipline' : 'MC202'});
      request.send({'offering' : '2014-1-B'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeRequirement permission', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'userToken');
      request.send({'discipline' : 'MC202'});
      request.send({'offering' : '2014-1-B'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error with invalid code', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/invalid');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC202'});
      request.send({'offering' : '2014-1-B'});
      request.expect(404);
      request.end(done);
    });

    it('should raise error without discipline', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'adminToken');
      request.send({'offering' : '2014-1-B'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('discipline').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without offering', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC202'});
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('offering').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error without discipline and offering', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'adminToken');
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('discipline').be.equal('required');
        response.body.should.have.property('offering').be.equal('required');
      });
      request.end(done);
    });

    it('should raise error before enrollment cancellation period starts', function (done) {
      var request, time;

      time = new Date('2014-02-01');
      timekeeper.travel(time);

      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC202'});
      request.send({'offering' : '2014-1-B'});
      request.send({'status' : 'quit'});
      request.expect(function() {
        timekeeper.travel(referenceDate);
      });
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('status').be.equal('outside of discipline quit period');

      });
      request.end(done);
    });

    it('should raise error when enrollment cancellation period has already ended', function (done) {
      var request, time;

      time = new Date('2014-12-30');
      timekeeper.travel(time);

      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC202'});
      request.send({'offering' : '2014-1-B'});
      request.send({'status' : 'quit'});
      request.expect(function() {
        timekeeper.travel(referenceDate);
      });
      request.expect(400);
      request.expect(function (response) {
        timekeeper.travel(referenceDate);
        response.body.should.have.property('status').be.equal('outside of discipline quit period');
      });
      request.end(done);
    });

    it('should update', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC202'});
      request.send({'offering' : '2014-1-B'});
      request.expect(200);
      request.end(done);
    });

    describe('with code taken', function () {
      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC102'});
        request.send({'offering' : '2014-1-A'});
        request.end(done);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC202'});
        request.send({'offering' : '2014-1-B'});
        request.expect(409);
        request.end(done);
      });
    });
  });

  describe('delete', function () {
    before(Requirement.remove.bind(Requirement));

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments/2014-1/requirements');
      request.set('csrf-token', 'adminToken');
      request.send({'discipline' : 'MC102'});
      request.send({'offering' : '2014-1-A'});
      request.end(done);
    });

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeRequirement permission', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'userToken');
      request.expect(403);
      request.end(done);
    });

    it('should raise error with invalid code', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/users/111111/enrollments/2014-1/requirements/invalid');
      request.set('csrf-token', 'adminToken');
      request.expect(404);
      request.end(done);
    });

    it('should delete', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
      request.set('csrf-token', 'adminToken');
      request.expect(204);
      request.end(done);
    });
  });
});