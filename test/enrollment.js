/*globals describe, before, beforeEach, it, after*/
require('should');
var supertest, app, timekeeper, referenceDate, Enrollment;
supertest = require('supertest');
app = require('../index.js');
timekeeper = require('timekeeper');
Enrollment = require('../models/enrollment');
referenceDate = new Date('2014-07-11');

describe('enrollment controller', function () {
  'use strict';

  before(function (done) {
    timekeeper.travel(referenceDate);
    done();
  });

  describe('create', function () {
    before(Enrollment.remove.bind(Enrollment));

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without changeEnrollment permission', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'userToken');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without year', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'period' : '1'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('year').be.equal('required');
        });
        request.end(done);
      });
    });

    describe('without period', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2014});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('period').be.equal('required');
        });
        request.end(done);
      });
    });

    describe('without year and period', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('year').be.equal('required');
          response.body.should.have.property('period').be.equal('required');
        });
        request.end(done);
      });
    });

    describe('before enrollment period starts', function () {
      before(function () {
        var time;
        time = new Date('2014-02-01');
        timekeeper.travel(time);
      });

      after(function () {
        timekeeper.travel(referenceDate);
      });

      it('should raise error ', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2013});
        request.send({'period' : '1'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('createdAt').be.equal('outside the enrollment period');
        });
        request.end(done);
      });
    });

    describe('after enrollment period ended', function () {
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
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2013});
        request.send({'period' : '1'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('createdAt').be.equal('outside the enrollment period');
        });
        request.end(done);
      });
    });

    describe('with valid credentials, year, period, after enrollment period starts and before enrollment period ends', function () {
      it('should create', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.expect(201);
        request.end(done);
      });
    });

    describe('with code taken', function () {
      before(Enrollment.remove.bind(Enrollment));

      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.end(done);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.expect(409);
        request.end(done);
      });
    });
  });

  describe('list', function () {
    before(Enrollment.remove.bind(Enrollment));

    describe('with one in database', function () {
      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.end(done);
      });

      it('should list 1 in first page', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111111/enrollments');
        request.expect(200);
        request.expect(function (response) {
          response.body.should.be.instanceOf(Array).with.lengthOf(1);
          response.body.every(function (enrollment) {
            enrollment.should.have.property('year');
            enrollment.should.have.property('period');
          });
        });
        request.end(done);
      });

      it('should return empty in second page', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111111/enrollments');
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
    before(Enrollment.remove.bind(Enrollment));

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2014});
      request.send({'period' : '1'});
      request.end(done);
    });

    describe('without valid code', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111111/enrollments/2012-invalid');
        request.expect(404);
        request.end(done);
      });
    });

    describe('with valid code', function () {
      it('should show', function (done) {
        var request;
        request = supertest(app);
        request = request.get('/users/111111/enrollments/2014-1');
        request.expect(200);
        request.expect(function (response) {
          response.body.should.have.property('year').be.equal(2014);
          response.body.should.have.property('period').be.equal('1');
        });
        request.end(done);
      });
    });
  });

  describe('update', function () {
    before(Enrollment.remove.bind(Enrollment));

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2014});
      request.send({'period' : '1'});
      request.end(done);
    });

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1');
        request.send({'year' : 2015});
        request.send({'period' : '2'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without changeEnrollment permission', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'userToken');
        request.send({'year' : 2015});
        request.send({'period' : '2'});
        request.expect(403);
        request.end(done);
      });
    });

    describe('without valid code', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2012-invalid');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2015});
        request.send({'period' : '2'});
        request.expect(404);
        request.end(done);
      });
    });

    describe('without year', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.send({'period' : '2'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('year').be.equal('required');
        });
        request.end(done);
      });
    });

    describe('without period', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2015});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('period').be.equal('required');
        });
        request.end(done);
      });
    });

    describe('without year and period', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('year').be.equal('required');
          response.body.should.have.property('period').be.equal('required');
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
        request = request.put('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.send({'status' : 'cancelled'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('status').be.equal('outside of enrollment cancellation period');
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
        request = request.put('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.send({'status' : 'cancelled'});
        request.expect(400);
        request.expect(function (response) {
          response.body.should.have.property('status').be.equal('outside of enrollment cancellation period');
        });
        request.end(done);
      });
    });

    describe('with valid credentials, year, period, after enrollment period started and before cancellation period ends', function () {
      it('should update', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2015});
        request.send({'period' : '2'});
        request.expect(200);
        request.end(done);
      });
    });

    describe('with code taken', function () {
      before(function (done) {
        var request;
        request = supertest(app);
        request = request.post('/users/111111/enrollments');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2014});
        request.send({'period' : '1'});
        request.end(done);
      });

      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.put('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.send({'year' : 2015});
        request.send({'period' : '2'});
        request.expect(409);
        request.end(done);
      });
    });
  });

  describe('delete', function () {
    before(Enrollment.remove.bind(Enrollment));

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2014});
      request.send({'period' : '1'});
      request.end(done);
    });

    describe('without token', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/111111/enrollments/2014-1');
        request.expect(403);
        request.end(done);
      });
    });

    describe('without changeEnrollment permission', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'userToken');
        request.expect(403);
        request.end(done);
      });
    });

    describe('without valid code', function () {
      it('should raise error', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/111111/enrollments/2012-invalid');
        request.set('csrf-token', 'adminToken');
        request.expect(404);
        request.end(done);
      });
    });

    describe('with valid credentials and code', function () {
      it('should delete', function (done) {
        var request;
        request = supertest(app);
        request = request.del('/users/111111/enrollments/2014-1');
        request.set('csrf-token', 'adminToken');
        request.expect(204);
        request.end(done);
      });
    });
  });
});