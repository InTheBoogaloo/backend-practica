const { Router } = require('express');
const ctrl = require('../controllers/alumnos.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

// Cualquier usuario autenticado puede consultar
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtenerPorId);

// Solo ADMIN o DOCENTE pueden crear/modificar
router.post('/',   requireRol('ADMIN', 'DOCENTE'), ctrl.crear);
router.put('/:id', requireRol('ADMIN', 'DOCENTE'), ctrl.actualizar);

// Solo ADMIN puede eliminar
router.delete('/:id', requireRol('ADMIN'), ctrl.eliminar);

module.exports = router;
