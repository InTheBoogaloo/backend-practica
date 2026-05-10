const { Router } = require('express');
const authController = require('../controllers/auth.controller');

const router = Router();

// POST /api/v1/auth/login  — sin autenticación previa
router.post('/login', authController.login);

module.exports = router;
