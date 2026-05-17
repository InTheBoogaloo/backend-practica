const { Router }     = require('express');
const ctrl           = require('../controllers/evaluaciones.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/',  ctrl.listar);
router.post('/', requireRol('ADMIN', 'DOCENTE', 'ALUMNO'), ctrl.registrar);

module.exports = router;