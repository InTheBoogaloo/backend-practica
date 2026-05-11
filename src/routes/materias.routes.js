const { Router }      = require('express');
const ctrl            = require('../controllers/materias.controller');
const { requireRol }  = require('../middlewares/auth.middleware');

const router = Router();

// GET  /api/v1/materias          — cualquier rol autenticado
router.get('/',       ctrl.listar);

// GET  /api/v1/materias/:id      — cualquier rol autenticado
router.get('/:id',    ctrl.obtener);

// POST /api/v1/materias          — ADMIN o DOCENTE
router.post('/',      requireRol('ADMIN', 'DOCENTE'), ctrl.crear);

// PUT  /api/v1/materias/:id      — ADMIN o DOCENTE
router.put('/:id',    requireRol('ADMIN', 'DOCENTE'), ctrl.actualizar);

// DELETE /api/v1/materias/:id    — solo ADMIN
router.delete('/:id', requireRol('ADMIN'),            ctrl.eliminar);

module.exports = router;
