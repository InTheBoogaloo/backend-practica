const alumnosService = require('../services/alumnos.service');

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

function validarInput({ nombre, apellido_pat, email, matricula, password }, esCrear = false) {
  const errores = [];

  if (!nombre || nombre.trim().length < 2)
    errores.push('nombre es obligatorio y debe tener al menos 2 caracteres');

  if (!apellido_pat || apellido_pat.trim().length < 2)
    errores.push('apellido_pat es obligatorio y debe tener al menos 2 caracteres');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errores.push('email es obligatorio y debe tener formato válido');

  if (esCrear) {
    if (!matricula || matricula.trim().length < 3)
      errores.push('matricula es obligatoria y debe tener al menos 3 caracteres');
    if (!password || password.length < 6)
      errores.push('password es obligatorio y debe tener al menos 6 caracteres');
  }

  return errores;
}

// GET /alumnos
async function listar(req, res, next) {
  try {
    const { page = 0, size = 10, nombre = '', search } = req.query;
    const filtro = search || nombre; // search tiene prioridad

    if (isNaN(page) || parseInt(page) < 0)
      return errorResponse(res, 400, 'page debe ser >= 0', req.originalUrl);
    if (isNaN(size) || parseInt(size) < 1 || parseInt(size) > 100)
      return errorResponse(res, 400, 'size debe estar entre 1 y 100', req.originalUrl);

    return res.status(200).json(await alumnosService.listar({ page, size, nombre: filtro }));
  } catch (err) { next(err); }
}

// GET /alumnos/:id
async function obtenerPorId(req, res, next) {
  try {
    const { id } = req.params;
    if (isNaN(id) || parseInt(id) <= 0)
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);

    return res.status(200).json(await alumnosService.obtenerPorId(parseInt(id)));
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    next(err);
  }
}

// POST /alumnos
async function crear(req, res, next) {
  try {
    const { matricula, nombre, apellido_pat, apellido_mat, email, password } = req.body;

    const errores = validarInput({ nombre, apellido_pat, email, matricula, password }, true);
    if (errores.length > 0)
      return errorResponse(res, 400, errores.join(' | '), req.originalUrl);

    const alumno = await alumnosService.crear({
      matricula:    matricula.trim().toUpperCase(),
      nombre:       nombre.trim(),
      apellido_pat: apellido_pat.trim(),
      apellido_mat: apellido_mat ? apellido_mat.trim() : null,
      email:        email.trim().toLowerCase(),
      password,
    });

    return res.status(201).json(alumno);
  } catch (err) {
    if (err.status === 409) return errorResponse(res, 409, err.message, req.originalUrl);
    next(err);
  }
}

// PUT /alumnos/:id  — acepta apellido_pat o apellido como alias
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre, email } = req.body;
    const apellido_pat = req.body.apellido_pat || req.body.apellido;
    const apellido_mat = req.body.apellido_mat || null;

    if (isNaN(id) || parseInt(id) <= 0)
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);

    const errores = validarInput({ nombre, apellido_pat, email });
    if (errores.length > 0)
      return errorResponse(res, 400, errores.join(' | '), req.originalUrl);

    return res.status(200).json(await alumnosService.actualizar(parseInt(id), {
      nombre:       nombre.trim(),
      apellido_pat: apellido_pat.trim(),
      apellido_mat: apellido_mat ? apellido_mat.trim() : null,
      email:        email.trim().toLowerCase(),
    }));
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    if (err.status === 409) return errorResponse(res, 409, err.message, req.originalUrl);
    next(err);
  }
}

// DELETE /alumnos/:id
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    if (isNaN(id) || parseInt(id) <= 0)
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);

    await alumnosService.eliminar(parseInt(id));
    return res.status(204).send();
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    next(err);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };