const evaluacionesService = require('../services/evaluaciones.service');

const PATH = '/api/v1/evaluaciones';

async function registrar(req, res, next) {
  try {
    const { id_exposicion, id_alumno_evaluador, detalles } = req.body;

    if (!id_exposicion || !id_alumno_evaluador || !detalles) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'Los campos id_exposicion, id_alumno_evaluador y detalles son obligatorios',
        path:      PATH,
      });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'El campo detalles debe ser un arreglo con al menos un elemento',
        path:      PATH,
      });
    }

    for (const d of detalles) {
      if (d.id_criterio == null || d.calificacion == null) {
        return res.status(400).json({
          timestamp: new Date().toISOString(),
          status:    400,
          error:     'Bad Request',
          message:   'Cada detalle debe tener id_criterio y calificacion',
          path:      PATH,
        });
      }

      const cal = parseFloat(d.calificacion);
      if (isNaN(cal) || cal < 0 || cal > 10) {
        return res.status(400).json({
          timestamp: new Date().toISOString(),
          status:    400,
          error:     'Bad Request',
          message:   `La calificación del criterio ${d.id_criterio} debe estar entre 0 y 10`,
          path:      PATH,
        });
      }
    }

    const evaluacion = await evaluacionesService.registrar({
      id_exposicion:       parseInt(id_exposicion),
      id_alumno_evaluador: parseInt(id_alumno_evaluador),
      detalles,
    });

    res.status(201).json(evaluacion);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ timestamp: new Date().toISOString(), status: 400, error: 'Bad Request',  message: err.message, path: PATH });
    if (err.status === 404) return res.status(404).json({ timestamp: new Date().toISOString(), status: 404, error: 'Not Found',   message: err.message, path: PATH });
    if (err.status === 409) return res.status(409).json({ timestamp: new Date().toISOString(), status: 409, error: 'Conflict',    message: err.message, path: PATH });
    next(err);
  }
}

module.exports = { registrar };