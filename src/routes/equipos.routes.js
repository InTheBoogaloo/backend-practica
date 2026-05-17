const { Router }     = require('express');
const ctrl           = require('../controllers/equipos.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/',     ctrl.listar);
router.get('/:id',  ctrl.obtener);
router.post('/',    requireRol('ADMIN', 'DOCENTE', 'ALUMNO'), ctrl.crear);
router.put('/:id',  requireRol('ADMIN', 'DOCENTE'),           ctrl.actualizar);
router.delete('/:id', requireRol('ADMIN'),                    ctrl.eliminar);

module.exports = router;