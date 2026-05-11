const materiasService = require('../services/materias.service');

const PATH = '/api/v1/materias';

/**
 * GET /api/v1/materias
 * Query params: page, size, nombre
 */
async function listar(req, res, next) {
  try {
    const { page, size, nombre } = req.query;
    const resultado = await materiasService.listar({ page, size, nombre });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/materias/:id
 */
async function obtener(req, res, next) {
  try {
    const materia = await materiasService.obtenerPorId(parseInt(req.params.id));
    res.json(materia);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status:    404,
        error:     'Not Found',
        message:   err.message,
        path:      `${PATH}/${req.params.id}`,
      });
    }
    next(err);
  }
}

/**
 * POST /api/v1/materias
 * Body: { clave_materia, nombre_materia }
 */
async function crear(req, res, next) {
  try {
    const { clave_materia, nombre_materia } = req.body;

    // Validación de campos obligatorios
    if (!clave_materia || !nombre_materia) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'Los campos clave_materia y nombre_materia son obligatorios',
        path:      PATH,
      });
    }

    // Validación de longitudes
    if (clave_materia.length < 2 || clave_materia.length > 20) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'El campo clave_materia debe tener entre 2 y 20 caracteres',
        path:      PATH,
      });
    }

    if (nombre_materia.length < 3 || nombre_materia.length > 100) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'El campo nombre_materia debe tener entre 3 y 100 caracteres',
        path:      PATH,
      });
    }

    const materia = await materiasService.crear({ clave_materia, nombre_materia });
    res.status(201).json(materia);
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({
        timestamp: new Date().toISOString(),
        status:    409,
        error:     'Conflict',
        message:   err.message,
        path:      PATH,
      });
    }
    next(err);
  }
}

/**
 * PUT /api/v1/materias/:id
 * Body: { clave_materia, nombre_materia }
 */
async function actualizar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { clave_materia, nombre_materia } = req.body;

    if (!clave_materia || !nombre_materia) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'Los campos clave_materia y nombre_materia son obligatorios',
        path:      `${PATH}/${id}`,
      });
    }

    if (clave_materia.length < 2 || clave_materia.length > 20) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'El campo clave_materia debe tener entre 2 y 20 caracteres',
        path:      `${PATH}/${id}`,
      });
    }

    if (nombre_materia.length < 3 || nombre_materia.length > 100) {
      return res.status(400).json({
        timestamp: new Date().toISOString(),
        status:    400,
        error:     'Bad Request',
        message:   'El campo nombre_materia debe tener entre 3 y 100 caracteres',
        path:      `${PATH}/${id}`,
      });
    }

    const materia = await materiasService.actualizar(id, { clave_materia, nombre_materia });
    res.json(materia);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status:    404,
        error:     'Not Found',
        message:   err.message,
        path:      `${PATH}/${req.params.id}`,
      });
    }
    if (err.status === 409) {
      return res.status(409).json({
        timestamp: new Date().toISOString(),
        status:    409,
        error:     'Conflict',
        message:   err.message,
        path:      `${PATH}/${req.params.id}`,
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/v1/materias/:id
 */
async function eliminar(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    await materiasService.eliminar(id);
    res.status(204).send();
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        timestamp: new Date().toISOString(),
        status:    404,
        error:     'Not Found',
        message:   err.message,
        path:      `${PATH}/${req.params.id}`,
      });
    }
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
