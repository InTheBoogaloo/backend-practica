const authService = require('../services/auth.service');

/**
 * POST /api/v1/auth/login
 * Body: { username, password }
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    // Validación básica de campos
    if (!username || !password) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'Los campos username y password son obligatorios',
        path:      '/api/v1/auth/login',
      });
    }

    const resultado = await authService.login(username, password);
    return res.status(200).json(resultado);

  } catch (err) {
    if (err.status === 401) {
      return res.status(401).json({
        timestamp: new Date().toISOString(),
        status:    401,
        error:     'Unauthorized',
        message:   err.message,
        path:      '/api/v1/auth/login',
      });
    }
    next(err);
  }
}

module.exports = { login };
