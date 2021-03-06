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

nock(nconf.get('COURSES_URI')).get('/disciplines/MC102').times(Infinity).reply(200, {
  code: 'MC102',
  name: 'Introducao a programacao',
  credits: 6,
  department: 'IC',
  description: 'Introducao a programacao',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC202').times(Infinity).reply(200, {
  code: 'MC202',
  name: 'Estrutura de Dados',
  credits: 6,
  department: 'IC',
  description: 'Estrutura de Dados',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MA111').times(Infinity).reply(200, {
  code: 'MA111',
  name: 'Calculo 1',
  credits: 6,
  department: 'IMECC',
  description: 'Calculo 1',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MA141').times(Infinity).reply(200, {
  code: 'MA141',
  name: 'Geometria Analítica e Vetores',
  credits: 4,
  department: 'IMECC',
  description: 'Geometria Analítica e Vetores',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC302').times(Infinity).reply(200, {
  code: 'MC302',
  name: 'Programacao orientada a objetos',
  credits: 4,
  department: 'IC',
  description: 'Programacao orientada a objetos',
  requirements: [ {
    code: 'MC202',
    name: 'Estrutura de Dados',
    credits: 6,
    department: 'IC',
    description: 'Estrutura de Dados'
  }]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/CE738').times(Infinity).reply(200, {
  code: 'CE738',
  name: 'Economia para Engenharia',
  credits: 4,
  department: 'IE',
  description: 'Economia para Engenharia',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/F%20128').times(Infinity).reply(200, {
  code: 'F 128',
  name: 'Física Geral I',
  credits: 4,
  department: 'IFGH',
  description: 'Física Geral I',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC886').times(Infinity).reply(200, {
  code: 'MC886',
  name: 'Aprendizado de Máquina',
  credits: 4,
  department: 'IC',
  description: 'Aprendizado de Máquina',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC959').times(Infinity).reply(200, {
  code: 'MC959',
  name: 'Tópicos em Inteligência Artificial I',
  credits: 4,
  department: 'IC',
  description: 'Tópicos em Inteligência Artificial I',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/LA122').times(Infinity).reply(200, {
  code: 'LA122',
  name: 'Inglês Instrumental I',
  credits: 4,
  department: 'CEL',
  description: 'Inglês Instrumental I',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/BD190').times(Infinity).reply(200, {
  code: 'BD190',
  name: 'Participação Cultural I',
  credits: 2,
  department: 'IB',
  description: 'Participação Cultural I',
  requirements: []
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC102/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 14,
      'room'    : 'CC02'
    },
    {
      'weekday' : 5,
      'hour'    : 16,
      'room'    : 'CC02'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC102/offerings/2014-1-B').times(Infinity).reply(200, {
  'code'      : 'B',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '34',
        'name': 'Engenharia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 14,
      'room'    : 'CC02'
    },
    {
      'weekday' : 5,
      'hour'    : 16,
      'room'    : 'CC02'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MA111/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 2,
      'hour'    : 14,
      'room'    : 'CC02'
    },
    {
      'weekday' : 4,
      'hour'    : 16,
      'room'    : 'CC02'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MA141/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 2,
      'hour'    : 14,
      'room'    : 'CB05'
    },
    {
      'weekday' : 4,
      'hour'    : 20,
      'room'    : 'CB05'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC202/offerings/2014-1-B').times(Infinity).reply(200, {
  'code'      : 'B',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '34',
        'name': 'Engenharia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 4,
      'hour'    : 14,
      'room'    : 'CC02'
    },
    {
      'weekday' : 6,
      'hour'    : 16,
      'room'    : 'CC02'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/CE738/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 19,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 21,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/F%20128/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 19,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 21,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/F%20128/offerings/2014-1-B').times(Infinity).reply(200, {
  'code'      : 'B',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '34',
        'name': 'Engenharia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 19,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 21,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC886/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 8,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 8,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC886/offerings/2014-1-B').times(Infinity).reply(200, {
  'code'      : 'B',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '34',
        'name': 'Engenharia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 8,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 8,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC959/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 10,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 10,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/MC959/offerings/2014-1-B').times(Infinity).reply(200, {
  'code'      : 'B',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '34',
        'name': 'Engenharia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 10,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 10,
      'room'    : 'CB18'
    }
  ]
});


nock(nconf.get('COURSES_URI')).get('/disciplines/LA122/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 2,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 2,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/LA122/offerings/2014-1-B').times(Infinity).reply(200, {
  'code'      : 'B',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '34',
        'name': 'Engenharia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 2,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 2,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/BD190/offerings/2014-1-A').times(Infinity).reply(200, {
  'code'      : 'A',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '42',
        'name': 'Ciencia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 4,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 4,
      'room'    : 'CB18'
    }
  ]
});

nock(nconf.get('COURSES_URI')).get('/disciplines/BD190/offerings/2014-1-B').times(Infinity).reply(200, {
  'code'      : 'B',
  'year'      : '2014',
  'period'    : '1',
  'reservations': [
    {
      'yearCatalog' : 2014,
      'course' : {
        'code': '34',
        'name': 'Engenharia da computação',
        'level': 'GRAD'
      }
    }
  ],
  'schedules' : [
    {
      'weekday' : 3,
      'hour'    : 4,
      'room'    : 'CB18'
    },
    {
      'weekday' : 5,
      'hour'    : 4,
      'room'    : 'CB18'
    }
  ]
});


nock(nconf.get('COURSES_URI')).get('/disciplines/MC202/offerings/2014-1-F').times(Infinity).reply(404);
nock(nconf.get('COURSES_URI')).get('/disciplines/MC202/offerings/2014-1-F').times(Infinity).reply(404);

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA').times(Infinity).reply(200, {
  'code'        : 'AA',
  'creditLimit' : 10,
  'course'      : '42'
});


nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks?page=0').times(Infinity).reply(200, [
  {
    'code': 'visao',
    'type': 'elective',
    'credits': 4
  },
  {
    'code': 'nucleo-comum',
    'type': 'obligatory'
  },
  {
    'code': 'extracurriculares',
    'type': 'extracurricular',
    'credits': 14
  }
]);

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks?page=1').times(Infinity).reply(200, []);

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks/nucleo-comum/requirements/MA111').times(Infinity).reply(200, {
  discipline:
  {
    code: 'MA111',
    name: 'Calculo 1',
    credits: 6,
    department: 'IMECC',
    description: 'Calculo 1',
    requirements: []
  },
  "suggestedSemester": 2
});

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks/nucleo-comum/requirements/MC102').times(Infinity).reply(200, {
  discipline:
   {
      code: 'MC102',
      name: 'Introducao a programacao',
      credits: 6,
      department: 'IC',
      description: 'Introducao a programacao',
      requirements: []
    },
    "suggestedSemester": 1
});

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks/nucleo-comum/requirements/MC202').times(Infinity).reply(200, {
  discipline:
  {
    code: 'MC202',
    name: 'Estrutura de Dados',
    credits: 6,
    department: 'IC',
    description: 'Estrutura de Dados',
    requirements: []
  },
  "suggestedSemester": 2
});

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks/nucleo-comum/requirements/F%20128').times(Infinity).reply(200, {
  discipline:
  {
    code: 'F 128',
    name: 'Física Geral I',
    credits: 4,
    department: 'IFGH',
    description: 'Física Geral I',
    requirements: []
  },
  "suggestedSemester": 2
});

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks/visao/requirements/MC886').times(Infinity).reply(200, {
  discipline:
  {
    code: 'MC886',
    name: 'Aprendizado de Máquina',
    credits: 4,
    department: 'IC',
    description: 'Aprendizado de Máquinas',
    requirements: []
  },
  "suggestedSemester": 1
});

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks/visao/requirements/MC959').times(Infinity).reply(200, {
  discipline:
  {
    code: 'MC959',
    name: 'Tópicos em Inteligência Artificial I',
    credits: 4,
    department: 'IC',
    description: 'Tópicos em Inteligência Artificial I',
    requirements: []
  },
  "suggestedSemester": 2
});

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks/extracurriculares/requirements/LA122').times(Infinity).reply(200, {
  discipline:
  {
    code: 'LA122',
    name: 'Inglês Instrumental I',
    credits: 4,
    department: 'IC',
    description: 'Inglês Instrumental I',
    requirements: []
  },
  "suggestedSemester": 1
});

nock(nconf.get('COURSES_URI')).get('/catalogs/2014/modalities/42-AA/blocks/extracurriculares/requirements/BD190').times(Infinity).reply(200, {
  discipline:
  {
    code: 'BD190',
    name: 'Participação Cultural I',
    credits: 2,
    department: 'IB',
    description: 'Participação Cultural I',
    requirements: []
  },
  "suggestedSemester": 2
});


nock(nconf.get('HISTORY_URI')).get('/users/111111/histories?page=0').times(Infinity).reply(200, [{
  year: 2014,
  course: '42',
  modality: 'AA',
  efficiencyCoefficient: 1,
  courseProgress: 0
}]);

nock(nconf.get('HISTORY_URI')).get('/users/111111/histories?page=1').times(Infinity).reply(200, []);

nock(nconf.get('HISTORY_URI')).get('/users/111111/histories/2014/disciplines/MC202').times(Infinity).reply(200, {
  status: 5
});

/* Expected 404 Errors */
// All courses that a student is trying to enroll in should not exist in his history, so that
// error 'user was already approved on discipline' does not trigger
nock(nconf.get('HISTORY_URI')).get('/users/111111/histories/2014/disciplines/MC102').times(Infinity).reply(404);
nock(nconf.get('HISTORY_URI')).get('/users/111111/histories/2014/disciplines/MC302').times(Infinity).reply(404);
nock(nconf.get('HISTORY_URI')).get('/users/111111/histories/2014/disciplines/MA111').times(Infinity).reply(404);

/* End of Expected 404 Errors */

nock(nconf.get('HISTORY_URI')).get('/users/111111/histories/2014/disciplines/CE738').times(Infinity).reply(200, {
  status: 4
});

nock(nconf.get('CALENDAR_URI')).get('/calendars/2014/events/enrollment-starts').times(Infinity).reply(200, {
  'slug'        : 'enrollment-starts',
  'name'        : 'Inicio do periodo de matricula',
  'date'        : new Date('2014-07-01'),
  'description' : 'Dia que é possivel realizar um pedido de matricula'
});

nock(nconf.get('CALENDAR_URI')).get('/calendars/2014/events/enrollment-ends').times(Infinity).reply(200, {
  'slug'        : 'enrollment-ends',
  'name'        : 'Final do periodo de matricula',
  'date'        : new Date('2014-07-15'),
  'description' : 'Dia em que nao é mais possivel fazer um pedido de matricula'
});

nock(nconf.get('CALENDAR_URI')).get('/calendars/2014/events/cancellation-starts').times(Infinity).reply(200, {
  'slug'        : 'cancellation-starts',
  'name'        : 'Inicio do periodo de trancamento de matricula',
  'date'        : new Date('2014-07-01'),
  'description' : 'Dia que é possivel realizar um pedido de trancamento de matricula'
});

nock(nconf.get('CALENDAR_URI')).get('/calendars/2014/events/cancellation-ends').times(Infinity).reply(200, {
  'slug'        : 'cancellation-ends',
  'name'        : 'Final do periodo de trancamento de matricula',
  'date'        : new Date('2014-10-15'),
  'description' : 'Dia em que nao é mais possivel fazer um pedido de trancamento de matricula'
});

nock(nconf.get('CALENDAR_URI')).get('/calendars/2014/events/discipline-quit-starts').times(Infinity).reply(200, {
  'slug'        : 'discipline-quit-starts',
  'name'        : 'Inicio do periodo de desistencia de disciplinas',
  'date'        : new Date('2014-07-01'),
  'description' : 'Dia que é possivel realizar um pedido de desistencia de disciplina'
});

nock(nconf.get('CALENDAR_URI')).get('/calendars/2014/events/discipline-quit-ends').times(Infinity).reply(200, {
  'slug'        : 'discipline-quit-ends',
  'name'        : 'Final do periodo de desistencia de disciplinas',
  'date'        : new Date('2014-10-15'),
  'description' : 'Dia em que nao é mais possivel fazer um pedido de desistencia de disciplina'
});

it('should raise server', function (done) {
  'use strict';

  var request;
  request = supertest(app);
  request = request.get('/');
  request.expect(200);
  request.end(done);
});