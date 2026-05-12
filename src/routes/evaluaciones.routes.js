const { Router }     = require('express');
const ctrl           = require('../controllers/evaluaciones.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

// Solo ALUMNO puede registrar evaluaciones
router.post('/', requireRol('ALUMNO'), ctrl.registrar);

module.exports = router;