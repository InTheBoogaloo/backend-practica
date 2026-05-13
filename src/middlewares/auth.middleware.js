const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si es válido, adjunta el payload en req.user.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status:    401,
      error:     'Unauthorized',
      message:   'Token JWT ausente o mal formado',
      path:      req.originalUrl,
    });
  }

  const token = authHeader.split(' ')[1];



  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, username, rol }
    next();
  } catch (err) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status:    401,
      error:     'Unauthorized',
      message:   'Token JWT inválido o expirado',
      path:      req.originalUrl,
    });
  }
}

/**
 * Middleware de roles.
 * Uso: requireRol('ADMIN')  o  requireRol('ADMIN', 'DOCENTE')
 */
function requireRol(...roles) {
  return (req, res, next) => {
    console.log('req.user:', req.user);
    console.log('roles requeridos:', roles);
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        status:    403,
        error:     'Forbidden',
        message:   `Acceso restringido a: ${roles.join(', ')}`,
        path:      req.originalUrl,
      });
    }
    next();
  };
}


module.exports = { verifyToken, requireRol };
