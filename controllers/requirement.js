var VError, router, nconf, slug, auth, Requirement, Enrollment;

VError = require('verror');
router = require('express').Router();
nconf = require('nconf');
slug = require('slug');
auth = require('dacos-auth-driver');
Requirement = require('../models/requirement');
Enrollment = require('../models/enrollment');

/**
 * @api {post} /users/:user/enrollments/:enrollment/requirements Creates a new requirement.
 * @apiName createRequirement
 * @apiVersion 1.0.0
 * @apiGroup requirement
 * @apiPermission changeRequirement
 * @apiDescription
 * When creating a new requirement the user must send the requirement discipline and offering. The requirement code is
 * used for identifying and must be unique in the system. If a existing code is sent to this method, a 409 error will be
 * raised. And if no discipline and offering is sent, a 400 error will be raised.
 *
 * @apiParam {String} discipline Requirement discipline.
 * @apiParam {String} offering Requirement offering.
 *
 * @apiErrorExample
 * HTTP/1.1 400 Bad Request
 * {
 *   "discipline": "required",
 *   "offering": "required"
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
.route('/users/:user/enrollments/:enrollment/requirements')
.post(auth.can('changeRequirement'))
.post(function createRequirement(request, response, next) {
  'use strict';

  var requirement;
  requirement = new Requirement({
    'enrollment' : request.enrollment,
    'discipline' : request.param('discipline'),
    'offering'   : request.param('offering')
  });
  return requirement.save(function createdRequirement(error) {
    if (error) {
      error = new VError(error, 'error creating requirement');
      return next(error);
    }
    return response.status(201).end();
  });
});

/**
 * @api {get} /users/:user/enrollments/:enrollment/requirements List all system requirements.
 * @apiName listRequirement
 * @apiVersion 1.0.0
 * @apiGroup requirement
 * @apiPermission none
 * @apiDescription
 * This method returns an array with all requirements in the database. The data is returned in pages of length 20. If no
 * page is passed, the system will assume the requested page is page 0, otherwise the desired page must be sent.
 *
 * @apiParam {[Number=0]} page Requested page.
 *
 * @apiSuccess (requirement) {String} discipline Requirement discipline.
 * @apiSuccess (requirement) {String} offering Requirement offering.
 * @apiSuccess (requirement) {String} status Requirement status.
 * @apiSuccess (requirement) {String} comment Requirement comment.
 * @apiSuccess (requirement) {String} justification Requirement justification.
 * @apiSuccess (requirement) {Number} priority Requirement priority.
 * @apiSuccess (requirement) {Date} createdAt Requirement creation date.
 * @apiSuccess (requirement) {Date} updatedAt Requirement last update date.
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * [{
 *   "discipline": "MC102",
 *   "offering": "2014-1-A",
 *   "status": "new",
 *   "priority": 4,
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }]
 */
router
.route('/users/:user/enrollments/:enrollment/requirements')
.get(function listRequirement(request, response, next) {
  'use strict';

  var pageSize, page, query;
  pageSize = nconf.get('PAGE_SIZE');
  page = request.param('page', 0) * pageSize;
  query = Requirement.find();
  query.skip(page);
  query.limit(pageSize);
  return query.exec(function listedRequirement(error, requirements) {
    if (error) {
      error = new VError(error, 'error finding requirements');
      return next(error);
    }
    return response.status(200).send(requirements);
  });
});

/**
 * @api {get} /users/:user/enrollments/:enrollment/requirements/:requirement Get requirement information.
 * @apiName getRequirement
 * @apiVersion 1.0.0
 * @apiGroup requirement
 * @apiPermission none
 * @apiDescription
 * This method returns a single requirement details, the requirement code must be passed in the uri to identify the requested
 * requirement. If no requirement with the requested code was found, a 404 error will be raised.
 *
 * @apiSuccess {String} discipline Requirement discipline.
 * @apiSuccess {String} offering Requirement offering.
 * @apiSuccess {String} status Requirement status.
 * @apiSuccess {String} comment Requirement comment.
 * @apiSuccess {String} justification Requirement justification.
 * @apiSuccess {Number} priority Requirement priority.
 * @apiSuccess {Date} createdAt Requirement creation date.
 * @apiSuccess {Date} updatedAt Requirement last update date.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiSuccessExample
 * HTTP/1.1 200 OK
 * {
 *   "discipline": "MC102",
 *   "offering": "2014-1-A",
 *   "status": "new",
 *   "priority": 4,
 *   "createdAt": "2014-07-01T12:22:25.058Z",
 *   "updatedAt": "2014-07-01T12:22:25.058Z"
 * }
 */
router
.route('/users/:user/enrollments/:enrollment/requirements/:requirement')
.get(function getRequirement(request, response) {
  'use strict';

  var requirement;
  requirement = request.requirement;
  return response.status(200).send(requirement);
});

/**
 * @api {put} /users/:user/enrollments/:enrollment/requirements/:requirement Updates requirement information.
 * @apiName updateRequirement
 * @apiVersion 1.0.0
 * @apiGroup requirement
 * @apiPermission changeRequirement
 * @apiDescription
 * When updating a requirement the user must send the requirement discipline, offering, status, comment and
 * justification. If a existing code which is not the original requirement code is sent to this method, a 409 error will
 * be raised. And if no discipline and offering is sent, a 400 error will be raised. If no requirement with the
 * requested code was found, a 404 error will be raised.
 *
 * @apiParam {String} discipline Requirement discipline.
 * @apiParam {String} offering Requirement offering.
 * @apiParam {String} status Requirement status.
 * @apiParam {String} comment Requirement comment.
 *
 * @apiErrorExample
 * HTTP/1.1 404 Not Found
 * {}
 *
 * @apiErrorExample
 * HTTP/1.1 400 Bad Request
 * {
 *   "discipline": "required",
 *   "offering": "required"
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
.route('/users/:user/enrollments/:enrollment/requirements/:requirement')
.put(auth.can('changeRequirement'))
.put(function updateRequirement(request, response, next) {
  'use strict';

  var requirement;
  requirement = request.requirement;
  requirement.discipline = request.param('discipline');
  requirement.offering = request.param('offering');

  if (request.param('status')) {
    requirement.status = request.param('status');
  }

  requirement.comment = request.param('comment');
  return requirement.save(function updatedRequirement(error) {
    if (error) {
      error = new VError(error, 'error updating requirement: "%s"', request.params.requirement);
      return next(error);
    }
    return response.status(200).end();
  });
});

/**
 * @api {delete} /users/:user/enrollments/:enrollment/requirements/:requirement Removes requirement.
 * @apiName removeRequirement
 * @apiVersion 1.0.0
 * @apiGroup requirement
 * @apiPermission changeRequirement
 * @apiDescription
 * This method removes a requirement from the system. If no requirement with the requested code was found, a 404 error will be
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
.route('/users/:user/enrollments/:enrollment/requirements/:requirement')
.delete(auth.can('changeRequirement'))
.delete(function removeRequirement(request, response, next) {
  'use strict';

  var requirement;
  requirement = request.requirement;
  return requirement.remove(function removedRequirement(error) {
    if (error) {
      error = new VError(error, 'error removing requirement: "%s"', request.params.requirement);
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

router.param('requirement', function findRequirement(request, response, next, id) {
  'use strict';

  var query, code;
  code = id.split('-');
  query = Requirement.findOne();
  query.where('discipline').equals(code[0]);
  query.where('offering').equals(code[1] + '-' + code[2] + '-' + code[3]);
  query.exec(function foundRequirement(error, requirement) {
    if (error) {
      error = new VError(error, 'error finding requirement: "%s"', requirement);
      return next(error);
    }
    if (!requirement) {
      return response.status(404).end();
    }
    request.requirement = requirement;
    return next();
  });
});

module.exports = router;