var VError, router, nconf, slug, auth, Enrollment;

VError = require('verror');
router = require('express').Router();
nconf = require('nconf');
slug = require('slug');
auth = require('dacos-auth-driver');
Enrollment = require('../models/enrollment');

/**
 * @api {post} /users/:user/enrollments Creates a new enrollment.
 * @apiName createEnrollment
 * @apiVersion 1.0.0
 * @apiGroup enrollment
 * @apiPermission changeEnrollment
 * @apiDescription
 * When creating a new enrollment the user must send the enrollment year and period. The enrollment code is used for
 * identifying and must be unique in the system. If a existing code is sent to this method, a 409 error will be raised.
 * And if no year or period is sent, a 400 error will be raised.
 *
 * @apiParam {Number} year Enrollment year.
 * @apiParam {String} period Enrollment period.
 *
 * @apiErrorExample
 * HTTP/1.1 400 Bad Request
 * {
 *   "year": "required",
 *   "period": "required"
 * }
 *
 * @apiErrorExample
 * HTTP/1.1 403 Forbidden
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 409 Conflict
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 201 Created
 * {}
 */
router
.route('/users/:user/enrollments')
.post(auth.can('changeEnrollment'))
.post(function createEnrollment(request, response, next) {
  'use strict';

  var enrollment;
  enrollment = new Enrollment({
    'user'   : request.params.user,
    'year'   : request.param('year'),
    'period' : request.param('period')
  });
  return enrollment.save(function createdEnrollment(error) {
    if (error) {
      error = new VError(error, 'error creating enrollment');
      return next(error);
    }
    return response.status(201).end();
  });
});

/**
 * @api {get} /users/:user/enrollments List all system enrollments.
 * @apiName listEnrollment
 * @apiVersion 1.0.0
 * @apiGroup enrollment
 * @apiPermission none
 * @apiDescription
 * This method returns an array with all enrollments in the database. The data is returned in pages of length 20. If no
 * page is passed, the system will assume the requested page is page 0, otherwise the desired page must be sent.
 *
 * @apiParam {[Number=0]} page Requested page.
 *
 * @apiSuccess (enrollment) {Number} year Enrollment year.
 * @apiSuccess (enrollment) {String} period Enrollment period.
 * @apiSuccess (enrollment) {Date} createdAt Enrollment creation date.
 * @apiSuccess (enrollment) {Date} updatedAt Enrollment last update date.
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * [{
 *   "year": 2014,
 *   "period": "1",
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }]
 */
router
.route('/users/:user/enrollments')
.get(function listEnrollment(request, response, next) {
  'use strict';

  var pageSize, page, query;
  pageSize = nconf.get('PAGE_SIZE');
  page = request.param('page', 0) * pageSize;
  query = Enrollment.find();
  query.where('user').equals(request.params.user);
  query.skip(page);
  query.limit(pageSize);
  return query.exec(function listedEnrollment(error, enrollments) {
    if (error) {
      error = new VError(error, 'error finding enrollments');
      return next(error);
    }
    return response.status(200).send(enrollments);
  });
});

/**
 * @api {get} /users/:user/enrollments/:enrollment Get enrollment information.
 * @apiName getEnrollment
 * @apiVersion 1.0.0
 * @apiGroup enrollment
 * @apiPermission none
 * @apiDescription
 * This method returns a single enrollment details, the enrollment code must be passed in the uri to identify the requested
 * enrollment. If no enrollment with the requested code was found, a 404 error will be raised.
 *
 * @apiSuccess (enrollment) {Number} year Enrollment year.
 * @apiSuccess (enrollment) {String} period Enrollment period.
 * @apiSuccess {Date} createdAt Enrollment creation date.
 * @apiSuccess {Date} updatedAt Enrollment last update date.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * {
 *   "year": 2014,
 *   "period": "1",
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }
 */
router
.route('/users/:user/enrollments/:enrollment')
.get(function getEnrollment(request, response) {
  'use strict';

  var enrollment;
  enrollment = request.enrollment;
  return response.status(200).send(enrollment);
});

/**
 * @api {put} /users/:user/enrollments/:enrollment Updates enrollment information.
 * @apiName updateEnrollment
 * @apiVersion 1.0.0
 * @apiGroup enrollment
 * @apiPermission changeEnrollment
 * @apiDescription
 * When updating a enrollment the user must send the enrollment year and period. If a existing code which is not the
 * original enrollment code is sent to this method, a 409 error will be raised. And if no year or period is sent, a 400
 * error will be raised. If no enrollment with the requested code was found, a 404 error will be raised.
 *
 * @apiParam {Number} year Enrollment year.
 * @apiParam {String} period Enrollment period.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 400 Bad Request
 * {
 *   "year": "required",
 *   "period": "required"
 * }
 *
 * @apiErrorExample
 * HTTP/1.1 403 Forbidden
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 409 Conflict
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 200 Ok
 * {}
 */
router
.route('/users/:user/enrollments/:enrollment')
.put(auth.can('changeEnrollment'))
.put(function updateEnrollment(request, response, next) {
  'use strict';

  var enrollment;
  enrollment = request.enrollment;
  enrollment.year = request.param('year');
  enrollment.period = request.param('period');
  return enrollment.save(function updatedEnrollment(error) {
    if (error) {
      error = new VError(error, 'error updating enrollment: "%s"', request.params.enrollment);
      return next(error);
    }
    return response.status(200).end();
  });
});

/**
 * @api {delete} /users/:user/enrollments/:enrollment Removes enrollment.
 * @apiName removeEnrollment
 * @apiVersion 1.0.0
 * @apiGroup enrollment
 * @apiPermission changeEnrollment
 * @apiDescription
 * This method removes a enrollment from the system. If no enrollment with the requested code was found, a 404 error will be
 * raised.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 403 Forbidden
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 204 No Content
 * {}
 */
router
.route('/users/:user/enrollments/:enrollment')
.delete(auth.can('changeEnrollment'))
.delete(function removeEnrollment(request, response, next) {
  'use strict';

  var enrollment;
  enrollment = request.enrollment;
  return enrollment.remove(function removedEnrollment(error) {
    if (error) {
      error = new VError(error, 'error removing enrollment: "%s"', request.params.enrollment);
      return next(error);
    }
    return response.status(204).end();
  });
});

router.param('enrollment', function findEnrollment(request, response, next, id) {
  'use strict';

  var query, code;
  code = id.split('-');
  query = Enrollment.findOne();
  query.where('year').equals(code[0]);
  query.where('period').equals(code[1]);
  query.where('user').equals(request.params.user);
  query.exec(function foundEnrollment(error, enrollment) {
    if (error) {
      error = new VError(error, 'error finding enrollment: "%s"', enrollment);
      return next(error);
    }
    if (!enrollment) {
      return response.status(404).end();
    }
    request.enrollment = enrollment;
    return next();
  });
});

module.exports = router;