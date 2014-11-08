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

  before(function (done) {
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

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.send({'discipline' : 'MC102'});
        request.send({'offering' : '2014-1-A'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without changeRequirement permission', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'userToken');
        request.send({'discipline' : 'MC102'});
        request.send({'offering' : '2014-1-A'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without discipline', function () {
      it('should raise error', function (done) {
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
    });

    describe('without offering', function () {
      it('should raise error', function (done) {
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
    });

    describe('without discipline and offering', function () {
      it('should raise error', function (done) {
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
    });

    describe('without valid offering', function () {
      it('should raise error', function (done) {
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
    });

    describe('without all discipline requirements', function () {
      it('should raise error', function (done) {
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
    });

    describe('with coursed discipline', function () {
      it('should raise error', function (done) {
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
    });

    describe('with valid credentials, discipline and offering', function () {
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
    });

    describe('with exceeding credit limit', function () {
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

      before(function (done) {
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

      it('should create a credit raise request', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MA111'});
        request.send({'offering' : '2014-1-A'});
        request.expect(201);
        request.end(done);
      });

      after(function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.expect(200);
        request.expect(function (response) {
          response.body.should.have.property('creditRaiseRequest');
          response.body.creditRaiseRequest.should.have.property('credits').be.equal(12);
          response.body.creditRaiseRequest.should.have.property('status').be.equal('pending');
        });
        request.end(done);
      });
    });

    describe('with time conflicting with another discipline', function () {
      before(Requirement.remove.bind(Requirement));

      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MA111'});
        request.send({'offering' : '2014-1-A'});
        request.end(done);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MA141'});
        request.send({'offering' : '2014-1-A'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('offering').be.equal('discipline with time conflict');
        });
        request.end(done);
      });
    });

    describe('with priority score', function () {
      describe('with reserved disciplines', function () {
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

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'F 128'});
          request.send({'offering' : '2014-1-A'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'MC886'});
          request.send({'offering' : '2014-1-A'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'MC959'});
          request.send({'offering' : '2014-1-A'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'LA122'});
          request.send({'offering' : '2014-1-A'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'BD190'});
          request.send({'offering' : '2014-1-A'});
          request.end(done);
        });

        it('should have a discipline with priority score 9 for obligatory discipline and not ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(9);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 6 for obligatory discipline and ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/F 128-2014-1-A');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(6);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 8 for elective discipline and not ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/MC886-2014-1-A');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(8);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 5 for elective discipline and ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/MC959-2014-1-A');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(5);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 1 for extracurricular discipline and not ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/LA122-2014-1-A');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(1);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 1 for extracurricular discipline and ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/BD190-2014-1-A');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(1);
          });
          request.end(done);
        });
      });

      describe('with not reserved disciplines', function () {
        before(Requirement.remove.bind(Requirement));

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'MC102'});
          request.send({'offering' : '2014-1-B'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'F 128'});
          request.send({'offering' : '2014-1-B'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'MC886'});
          request.send({'offering' : '2014-1-B'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'MC959'});
          request.send({'offering' : '2014-1-B'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'LA122'});
          request.send({'offering' : '2014-1-B'});
          request.end(done);
        });

        before(function (done) {
          var request;
          request = supertest(app);
          request = request.post('/users/111111/enrollments/2014-1/requirements');
          request.set('csrf-token', 'adminToken');
          request.send({'discipline' : 'BD190'});
          request.send({'offering' : '2014-1-B'});
          request.end(done);
        });

        it('should have a discipline with priority score 7 for obligatory discipline and not ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-B');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(7);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 3 for obligatory discipline and ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/F 128-2014-1-B');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(3);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 4 for elective discipline and not ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/MC886-2014-1-B');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(4);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 2 for elective discipline and ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/MC959-2014-1-B');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(2);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 0 for extracurricular discipline and not ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/LA122-2014-1-B');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(0);
          });
          request.end(done);
        });

        it('should have a discipline with priority score 0 for extracurricular discipline and ahead', function (done) {
          var request;
          request = supertest(app);
          request = request.get('/users/111111/enrollments/2014-1/requirements/BD190-2014-1-B');
          request.set('csrf-token', 'adminToken');
          request.expect(200);
          request.expect(function (response) {
            response.body.should.have.property('priority').be.equal(0);
          });
          request.end(done);
        });
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

    describe('with one in database', function () {
      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments/2014-1/requirements');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC102'});
        request.send({'offering' : '2014-1-A'});
        request.end(done);
      });

      it('should list 1 in first page', function (done) {
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

    describe('without valid code', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111111/enrollments/2014-1/requirements/invalid');
        request.expect(404);
        request.end(done);
      });
    });

    describe('with valid code', function () {
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

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
        request.send({'discipline' : 'MC202'});
        request.send({'offering' : '2014-1-B'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without changeRequirement permission', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
        request.set('csrf-token', 'userToken');
        request.send({'discipline' : 'MC202'});
        request.send({'offering' : '2014-1-B'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without valid code', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1/requirements/invalid');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC202'});
        request.send({'offering' : '2014-1-B'});
        request.expect(404);
        request.end(done);
      });
    });

    describe('without discipline', function () {
      it('should raise error', function (done) {
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
    });

    describe('without offering', function () {
      it('should raise error', function (done) {
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
    });

    describe('without discipline and offering', function () {
      it('should raise error', function (done) {
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
    });

    describe('before enrollment cancellation period starts', function () {
      before(function () {
        var time;
        time = new Date('2014-02-01');
        timekeeper.travel(time);
      });

      after(function () {
        timekeeper.travel(referenceDate);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC202'});
        request.send({'offering' : '2014-1-B'});
        request.send({'status' : 'quit'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('status').be.equal('outside of discipline quit period');
        });
        request.end(done);
      });
    });

    describe('after enrollment cancellation period ends', function () {
      before(function () {
        var time;
        time = new Date('2014-12-30');
        timekeeper.travel(time);
      });

      after(function () {
        timekeeper.travel(referenceDate);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
        request.set('csrf-token', 'adminToken');
        request.send({'discipline' : 'MC202'});
        request.send({'offering' : '2014-1-B'});
        request.send({'status' : 'quit'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('status').be.equal('outside of discipline quit period');
        });
        request.end(done);
      });
    });

    describe('with valid credentials, discipline, offering, after enrollment period started and before cancellation period ends', function () {
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

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
        request.expect(403);
        request.end(done);
      });
    });

    describe('without changeRequirement permission', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/111111/enrollments/2014-1/requirements/MC102-2014-1-A');
        request.set('csrf-token', 'userToken');
        request.expect(403);
        request.end(done);
      });
    });

    describe('without valid code', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/111111/enrollments/2014-1/requirements/invalid');
        request.set('csrf-token', 'adminToken');
        request.expect(404);
        request.end(done);
      });
    });

    describe('with valid credentials and code', function () {
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
});