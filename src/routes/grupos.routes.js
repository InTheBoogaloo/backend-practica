const { Router } = require('express');
const ctrl = require('../controllers/grupos.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtenerPorId);
router.post('/',   requireRol('ADMIN', 'DOCENTE'), ctrl.crear);
router.put('/:id', requireRol('ADMIN', 'DOCENTE'), ctrl.actualizar);
router.post('/:id/alumnos',              requireRol('ADMIN', 'DOCENTE'), ctrl.inscribirAlumno);
router.delete('/:id/alumnos/:id_alumno', requireRol('ADMIN', 'DOCENTE'), ctrl.quitarAlumno);
router.delete('/:id', requireRol('ADMIN', 'DOCENTE'), ctrl.eliminar);

module.exports = router;