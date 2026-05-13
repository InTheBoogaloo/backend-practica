const { Router } = require('express');
const ctrl = require('../controllers/grupos.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

// Consultas — cualquier usuario autenticado
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtenerPorId);

// Gestión de grupos — ADMIN o DOCENTE
router.post('/',   requireRol('ADMIN', 'DOCENTE'), ctrl.crear);
router.put('/:id', requireRol('ADMIN', 'DOCENTE'), ctrl.actualizar);

// Inscripción de alumnos — ADMIN o DOCENTE
router.post('/:id/alumnos',              requireRol('ADMIN', 'DOCENTE'), ctrl.inscribirAlumno);
router.delete('/:id/alumnos/:id_alumno', requireRol('ADMIN', 'DOCENTE'), ctrl.quitarAlumno);

// Eliminar grupo — solo ADMIN
router.delete('/:id', requireRol('ADMIN'), ctrl.eliminar);

module.exports = router;
