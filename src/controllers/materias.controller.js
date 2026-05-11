const materiasService = require('../services/materias.service');

// ─── Helper: respuesta de error estandarizada ─────────────────
function errorResponse(res, status, message, path) {
  return res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error:   status === 400 ? 'Bad Request'
           : status === 404 ? 'Not Found'
           : status === 409 ? 'Conflict'
           : 'Error',
    message,
    path,
  });
}

// ─── Validar body de entrada ──────────────────────────────────
function validarInput({ clave_materia, nombre_materia }, path) {
  const errores = [];

  if (!clave_materia || typeof clave_materia !== 'string') {
    errores.push('El campo clave_materia es obligatorio');
  } else if (clave_materia.trim().length < 2) {
    errores.push('clave_materia debe tener al menos 2 caracteres');
  } else if (clave_materia.trim().length > 20) {
    errores.push('clave_materia no puede superar 20 caracteres');
  }

  if (!nombre_materia || typeof nombre_materia !== 'string') {
    errores.push('El campo nombre_materia es obligatorio');
  } else if (nombre_materia.trim().length < 3) {
    errores.push('nombre_materia debe tener al menos 3 caracteres');
  } else if (nombre_materia.trim().length > 150) {
    errores.push('nombre_materia no puede superar 150 caracteres');
  }

  return errores;
}

// ─── GET /materias ────────────────────────────────────────────
async function listar(req, res, next) {
  try {
    const { page = 0, size = 10, nombre = '' } = req.query;

    // Validar paginación
    if (isNaN(page) || parseInt(page) < 0) {
      return errorResponse(res, 400, 'El parámetro page debe ser un entero >= 0', req.originalUrl);
    }
    if (isNaN(size) || parseInt(size) < 1 || parseInt(size) > 100) {
      return errorResponse(res, 400, 'El parámetro size debe estar entre 1 y 100', req.originalUrl);
    }

    const resultado = await materiasService.listar({ page, size, nombre });
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

// ─── GET /materias/:id ────────────────────────────────────────
async function obtenerPorId(req, res, next) {
  try {
    const { id } = req.params;

    if (isNaN(id) || parseInt(id) <= 0) {
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);
    }

    const materia = await materiasService.obtenerPorId(parseInt(id));
    return res.status(200).json(materia);
  } catch (err) {
    if (err.status === 404) {
      return errorResponse(res, 404, err.message, req.originalUrl);
    }
    next(err);
  }
}

// ─── POST /materias ───────────────────────────────────────────
async function crear(req, res, next) {
  try {
    const { clave_materia, nombre_materia } = req.body;

    const errores = validarInput({ clave_materia, nombre_materia }, req.originalUrl);
    if (errores.length > 0) {
      return errorResponse(res, 400, errores.join(' | '), req.originalUrl);
    }

    const materia = await materiasService.crear({
      clave_materia:  clave_materia.trim().toUpperCase(),
      nombre_materia: nombre_materia.trim(),
    });

    return res.status(201).json(materia);
  } catch (err) {
    if (err.status === 409) {
      return errorResponse(res, 409, err.message, req.originalUrl);
    }
    next(err);
  }
}

// ─── PUT /materias/:id ────────────────────────────────────────
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { clave_materia, nombre_materia } = req.body;

    if (isNaN(id) || parseInt(id) <= 0) {
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);
    }

    const errores = validarInput({ clave_materia, nombre_materia }, req.originalUrl);
    if (errores.length > 0) {
      return errorResponse(res, 400, errores.join(' | '), req.originalUrl);
    }

    const materia = await materiasService.actualizar(parseInt(id), {
      clave_materia:  clave_materia.trim().toUpperCase(),
      nombre_materia: nombre_materia.trim(),
    });

    return res.status(200).json(materia);
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    if (err.status === 409) return errorResponse(res, 409, err.message, req.originalUrl);
    next(err);
  }
}

// ─── DELETE /materias/:id ─────────────────────────────────────
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;

    if (isNaN(id) || parseInt(id) <= 0) {
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);
    }

    await materiasService.eliminar(parseInt(id));
    return res.status(204).send();
  } catch (err) {
    if (err.status === 404) {
      return errorResponse(res, 404, err.message, req.originalUrl);
    }
    next(err);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
