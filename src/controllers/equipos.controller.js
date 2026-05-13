const equiposService = require('../services/equipos.service');

const PATH = '/api/v1/equipos';

async function crear(req, res, next) {
  try {
    const { id_grupo, nombre_equipo, id_alumno_creador, id_alumnos = [] } = req.body;

    if (!id_grupo || !nombre_equipo || !id_alumno_creador) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'Los campos id_grupo, nombre_equipo e id_alumno_creador son obligatorios',
        path:      PATH,
      });
    }

    if (!Array.isArray(id_alumnos)) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'El campo id_alumnos debe ser un arreglo',
        path:      PATH,
      });
    }

    if (nombre_equipo.trim().length < 3 || nombre_equipo.trim().length > 100) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'El campo nombre_equipo debe tener entre 3 y 100 caracteres',
        path:      PATH,
      });
    }

    const equipo = await equiposService.crear({
      id_grupo:          parseInt(id_grupo),
      nombre_equipo:     nombre_equipo.trim(),
      id_alumno_creador: parseInt(id_alumno_creador),
      id_alumnos:        id_alumnos.map(Number),
    });

    res.status(201).json(equipo);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ timestamp: new Date().toISOString(), status: 400, error: 'Bad Request', message: err.message, path: PATH });
    if (err.status === 404) return res.status(404).json({ timestamp: new Date().toISOString(), status: 404, error: 'Not Found',  message: err.message, path: PATH });
    if (err.status === 409) return res.status(409).json({ timestamp: new Date().toISOString(), status: 409, error: 'Conflict',   message: err.message, path: PATH });
    next(err);
  }
}

async function listar(req, res, next) {
  try {
    const { id_grupo } = req.query;
    const equipos = await equiposService.listar({ id_grupo: id_grupo ? parseInt(id_grupo) : null });
    res.json(equipos);
  } catch (err) {
    next(err);
  }
}

module.exports = { crear, listar };