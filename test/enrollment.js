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

  before(function(done) {
    timekeeper.travel(referenceDate);
    done();
  });

  describe('create', function () {
    before(Enrollment.remove.bind(Enrollment));

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments');
      request.send({'year' : 2014});
      request.send({'period' : '1'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeEnrollment permission', function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments');
      request.set('csrf-token', 'userToken');
      request.send({'year' : 2014});
      request.send({'period' : '1'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without year', function (done) {
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

    it('should raise error without period', function (done) {
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

    it('should raise error without year and period', function (done) {
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

    it('should raise error before enrollment period starts', function (done) {
      var request, time;

      time = new Date('2014-02-01');
      timekeeper.travel(time);

      request = supertest(app);
      request = request.post('/users/111111/enrollments');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2013});
      request.send({'period' : '1'});
      request.expect(function() {
        timekeeper.travel(referenceDate);
      });
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('createdAt').be.equal('outside the enrollment period');
      });
      request.end(done);
    });

    it('should raise error when enrollment period has already ended', function (done) {
      var request, time;

      time = new Date('2014-12-30');
      timekeeper.travel(time);

      request = supertest(app);
      request = request.post('/users/111111/enrollments');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2013});
      request.send({'period' : '1'});
      request.expect(function() {
        timekeeper.travel(referenceDate);
      });
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('createdAt').be.equal('outside the enrollment period');
      });
      request.end(done);
    });

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

    before(function (done) {
      var request;
      request = supertest(app);
      request = request.post('/users/111111/enrollments');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2014});
      request.send({'period' : '1'});
      request.end(done);
    });

    it('should list', function (done) {
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

    it('should raise error with 2012-invalid code', function (done) {
      var request;
      request = supertest(app);
      request = request.get('/users/111111/enrollments/2012-invalid');
      request.expect(404);
      request.end(done);
    });

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

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1');
      request.send({'year' : 2015});
      request.send({'period' : '2'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeEnrollment permission', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1');
      request.set('csrf-token', 'userToken');
      request.send({'year' : 2015});
      request.send({'period' : '2'});
      request.expect(403);
      request.end(done);
    });

    it('should raise error with invalid code', function (done) {
      var request;
      request = supertest(app);
      request = request.put('/users/111111/enrollments/2012-invalid');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2015});
      request.send({'period' : '2'});
      request.expect(404);
      request.end(done);
    });

    it('should raise error without year', function (done) {
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

    it('should raise error without period', function (done) {
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

    it('should raise error without year and period', function (done) {
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

    it('should raise error before enrollment cancellation period starts', function (done) {
      var request, time;

      time = new Date('2014-02-01');
      timekeeper.travel(time);

      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2014});
      request.send({'period' : '1'});
      request.send({'status' : 'cancelled'});
      request.expect(function() {
        timekeeper.travel(referenceDate);
      });
      request.expect(400);
      request.expect(function (response) {
        response.body.should.have.property('status').be.equal('outside of enrollment cancellation period');

      });
      request.end(done);
    });

    it('should raise error when enrollment cancellation period has already ended', function (done) {
      var request, time;

      time = new Date('2014-12-30');
      timekeeper.travel(time);

      request = supertest(app);
      request = request.put('/users/111111/enrollments/2014-1');
      request.set('csrf-token', 'adminToken');
      request.send({'year' : 2014});
      request.send({'period' : '1'});
      request.send({'status' : 'cancelled'});
      request.expect(function() {
        timekeeper.travel(referenceDate);
      });
      request.expect(400);
      request.expect(function (response) {
        timekeeper.travel(referenceDate);
        response.body.should.have.property('status').be.equal('outside of enrollment cancellation period');
      });
      request.end(done);
    });

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

    it('should raise error without token', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/users/111111/enrollments/2014-1');
      request.expect(403);
      request.end(done);
    });

    it('should raise error without changeEnrollment permission', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/users/111111/enrollments/2014-1');
      request.set('csrf-token', 'userToken');
      request.expect(403);
      request.end(done);
    });

    it('should raise error with 2012-invalid code', function (done) {
      var request;
      request = supertest(app);
      request = request.del('/users/111111/enrollments/2012-invalid');
      request.set('csrf-token', 'adminToken');
      request.expect(404);
      request.end(done);
    });

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