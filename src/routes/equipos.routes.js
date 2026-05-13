const { Router }     = require('express');
const ctrl           = require('../controllers/equipos.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

// GET  /api/v1/equipos           — cualquier rol autenticado
router.get('/',  ctrl.listar);

// POST /api/v1/equipos           — solo ALUMNO
router.post('/', requireRol('ALUMNO'), ctrl.crear);

module.exports = router;