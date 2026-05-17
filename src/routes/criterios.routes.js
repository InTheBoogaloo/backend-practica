const { Router } = require('express');
const ctrl = require('../controllers/criterios.controller');

const router = Router();

// GET /api/v1/criterios?id_exposicion=N
router.get('/', ctrl.listarPorExposicion);

module.exports = router;