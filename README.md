# dacos-enrollment v0.0.1

matrciula do sistema da diretoria academica DAC

- [enrollment](#enrollment)
	- [Creates a new enrollment.](#creates-a-new-enrollment.)
	- [Get enrollment information.](#get-enrollment-information.)
	- [List all system enrollments.](#list-all-system-enrollments.)
	- [Removes enrollment.](#removes-enrollment.)
	- [Updates enrollment information.](#updates-enrollment-information.)
	
- [requirement](#requirement)
	- [Creates a new requirement.](#creates-a-new-requirement.)
	- [Get requirement information.](#get-requirement-information.)
	- [List all system requirements.](#list-all-system-requirements.)
	- [Removes requirement.](#removes-requirement.)
	- [Updates requirement information.](#updates-requirement-information.)
	


# enrollment

## Creates a new enrollment.

When creating a new enrollment the user must send the enrollment year and period. The enrollment code is used for
identifying and must be unique in the system. If a existing code is sent to this method, a 409 error will be raised.
And if no year or period is sent, a 400 error will be raised.

	POST /users/:user/enrollments

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| year			| Number			|  Enrollment year.							|
| period			| String			|  Enrollment period.							|

### Success Response

HTTP/1.1 201 Created

```
{}

```
### Error Response

HTTP/1.1 400 Bad Request

```
{
 "year": "required",
 "period": "required"
}

```
HTTP/1.1 403 Forbidden

```
{}

```
HTTP/1.1 409 Conflict

```
{}

```
## Get enrollment information.

This method returns a single enrollment details, the enrollment code must be passed in the uri to identify the requested
enrollment. If no enrollment with the requested code was found, a 404 error will be raised.

	GET /users/:user/enrollments/:enrollment


### Success Response

HTTP/1.1 200 OK

```
{
 "year": 2014,
 "period": "1",
 "createdAt": "2014-07-01T12:22:25.058Z",
 "updatedAt": "2014-07-01T12:22:25.058Z"
}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
## List all system enrollments.

This method returns an array with all enrollments in the database. The data is returned in pages of length 20. If no
page is passed, the system will assume the requested page is page 0, otherwise the desired page must be sent.

	GET /users/:user/enrollments

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| page			| [Number=0]			|  Requested page.							|

### Success Response

HTTP/1.1 200 OK

```
[{
 "year": 2014,
 "period": "1",
 "createdAt": "2014-07-01T12:22:25.058Z",
 "updatedAt": "2014-07-01T12:22:25.058Z"
}]

```
## Removes enrollment.

This method removes a enrollment from the system. If no enrollment with the requested code was found, a 404 error will be
raised.

	DELETE /users/:user/enrollments/:enrollment


### Success Response

HTTP/1.1 204 No Content

```
{}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
HTTP/1.1 403 Forbidden

```
{}

```
## Updates enrollment information.

When updating a enrollment the user must send the enrollment year and period. If a existing code which is not the
original enrollment code is sent to this method, a 409 error will be raised. And if no year or period is sent, a 400
error will be raised. If no enrollment with the requested code was found, a 404 error will be raised.

	PUT /users/:user/enrollments/:enrollment

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| year			| Number			|  Enrollment year.							|
| period			| String			|  Enrollment period.							|

### Success Response

HTTP/1.1 200 Ok

```
{}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
HTTP/1.1 400 Bad Request

```
{
 "year": "required",
 "period": "required"
}

```
HTTP/1.1 403 Forbidden

```
{}

```
HTTP/1.1 409 Conflict

```
{}

```
# requirement

## Creates a new requirement.

When creating a new requirement the user must send the requirement discipline and offering. The requirement code is
used for identifying and must be unique in the system. If a existing code is sent to this method, a 409 error will be
raised. And if no discipline and offering is sent, a 400 error will be raised.

	POST /users/:user/enrollments/:enrollment/requirements

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| discipline			| String			|  Requirement discipline.							|
| offering			| String			|  Requirement offering.							|

### Success Response

HTTP/1.1 201 Created

```
{}

```
### Error Response

HTTP/1.1 400 Bad Request

```
{
 "discipline": "required",
 "offering": "required"
}

```
HTTP/1.1 403 Forbidden

```
{}

```
HTTP/1.1 409 Conflict

```
{}

```
## Get requirement information.

This method returns a single requirement details, the requirement code must be passed in the uri to identify the requested
requirement. If no requirement with the requested code was found, a 404 error will be raised.

	GET /users/:user/enrollments/:enrollment/requirements/:requirement


### Success Response

HTTP/1.1 200 OK

```
{
 "discipline": "MC102",
 "offering": "2014-1-A",
 "status": "new",
 "priority": 4,
 "createdAt": "2014-07-01T12:22:25.058Z",
 "updatedAt": "2014-07-01T12:22:25.058Z"
}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
## List all system requirements.

This method returns an array with all requirements in the database. The data is returned in pages of length 20. If no
page is passed, the system will assume the requested page is page 0, otherwise the desired page must be sent.

	GET /users/:user/enrollments/:enrollment/requirements

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| page			| [Number=0]			|  Requested page.							|

### Success Response

HTTP/1.1 200 OK

```
[{
 "discipline": "MC102",
 "offering": "2014-1-A",
 "status": "new",
 "priority": 4,
 "createdAt": "2014-07-01T12:22:25.058Z",
 "updatedAt": "2014-07-01T12:22:25.058Z"
}]

```
## Removes requirement.

This method removes a requirement from the system. If no requirement with the requested code was found, a 404 error will be
raised.

	DELETE /users/:user/enrollments/:enrollment/requirements/:requirement


### Success Response

HTTP/1.1 204 No Content

```
{}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
HTTP/1.1 403 Forbidden

```
{}

```
## Updates requirement information.

When updating a requirement the user must send the requirement discipline, offering, status, comment and
justification. If a existing code which is not the original requirement code is sent to this method, a 409 error will
be raised. And if no discipline and offering is sent, a 400 error will be raised. If no requirement with the
requested code was found, a 404 error will be raised.

	PUT /users/:user/enrollments/:enrollment/requirements/:requirement

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| discipline			| String			|  Requirement discipline.							|
| offering			| String			|  Requirement offering.							|
| status			| String			|  Requirement status.							|
| comment			| String			|  Requirement comment.							|

### Success Response

HTTP/1.1 200 Ok

```
{}

```
### Error Response

HTTP/1.1 404 Not Found

```
{}

```
HTTP/1.1 400 Bad Request

```
{
 "discipline": "required",
 "offering": "required"
}

```
HTTP/1.1 403 Forbidden

```
{}

```
HTTP/1.1 409 Conflict

```
{}

```

