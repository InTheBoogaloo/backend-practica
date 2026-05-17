const criteriosService = require('../services/criterios.service');

async function listarPorExposicion(req, res, next) {
  try {
    const { id_exposicion } = req.query;
    if (!id_exposicion || isNaN(id_exposicion) || parseInt(id_exposicion) <= 0) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status: 400, error: 'Bad Request',
        message: 'El parámetro id_exposicion es obligatorio y debe ser un entero positivo',
        path: req.originalUrl,
      });
    }
    const criterios = await criteriosService.listarPorExposicion(parseInt(id_exposicion));
    res.json(criterios);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({
      timestamp: new Date().toISOString(), status: 404, error: 'Not Found',
      message: err.message, path: req.originalUrl,
    });
    next(err);
  }
}

module.exports = { listarPorExposicion };