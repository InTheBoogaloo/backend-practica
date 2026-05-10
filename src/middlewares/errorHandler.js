/**
 * Middleware de manejo de errores global.
 * Captura cualquier error no manejado en los controladores.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);

  const status = err.status || 500;

  res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error:   status === 500 ? 'Internal Server Error' : err.error || 'Error',
    message: status === 500 ? 'Error interno del servidor' : err.message,
    path:    req.originalUrl,
  });
}

module.exports = errorHandler;
