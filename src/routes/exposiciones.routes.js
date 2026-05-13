const { Router }     = require('express');
const ctrl           = require('../controllers/exposiciones.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

// GET  /api/v1/exposiciones        — cualquier usuario autenticado
router.get('/',    ctrl.listar);

// GET  /api/v1/exposiciones/:id    — cualquier usuario autenticado
router.get('/:id', ctrl.obtenerPorId);

// POST /api/v1/exposiciones        — ADMIN o DOCENTE
router.post('/',   requireRol('ADMIN', 'DOCENTE'), ctrl.crear);

// PUT  /api/v1/exposiciones/:id    — ADMIN o DOCENTE
router.put('/:id', requireRol('ADMIN', 'DOCENTE'), ctrl.actualizar);

// DELETE /api/v1/exposiciones/:id  — solo ADMIN
router.delete('/:id', requireRol('ADMIN'), ctrl.eliminar);

module.exports = router;
