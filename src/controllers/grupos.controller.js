const gruposService = require('../services/grupos.service');

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

function validarId(id) { return !isNaN(id) && parseInt(id) > 0; }

function validarInput({ nombre_grupo, semestre, id_materia }) {
  const errores = [];
  if (!nombre_grupo || nombre_grupo.trim().length < 2)
    errores.push('nombre_grupo es obligatorio y debe tener al menos 2 caracteres');
  else if (nombre_grupo.trim().length > 50)
    errores.push('nombre_grupo no puede superar 50 caracteres');
  if (!semestre || semestre.trim().length < 2)
    errores.push('semestre es obligatorio');
  else if (semestre.trim().length > 20)
    errores.push('semestre no puede superar 20 caracteres');
  if (!id_materia || isNaN(id_materia) || parseInt(id_materia) <= 0)
    errores.push('id_materia es obligatorio y debe ser un entero positivo');
  return errores;
}

// GET /grupos
async function listar(req, res, next) {
  try {
    const { page = 0, size = 10, nombre = '' } = req.query;
    if (isNaN(page) || parseInt(page) < 0)
      return errorResponse(res, 400, 'page debe ser >= 0', req.originalUrl);
    if (isNaN(size) || parseInt(size) < 1 || parseInt(size) > 100)
      return errorResponse(res, 400, 'size debe estar entre 1 y 100', req.originalUrl);
    return res.status(200).json(await gruposService.listar({ page, size, nombre }));
  } catch (err) { next(err); }
}

// GET /grupos/:id
async function obtenerPorId(req, res, next) {
  try {
    const { id } = req.params;
    if (!validarId(id))
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);
    return res.status(200).json(await gruposService.obtenerPorId(parseInt(id)));
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    next(err);
  }
}

// POST /grupos
async function crear(req, res, next) {
  try {
    const { nombre_grupo, semestre, id_materia } = req.body;
    const errores = validarInput({ nombre_grupo, semestre, id_materia });
    if (errores.length > 0)
      return errorResponse(res, 400, errores.join(' | '), req.originalUrl);
    return res.status(201).json(await gruposService.crear({
      nombre_grupo: nombre_grupo.trim(),
      semestre:     semestre.trim(),
      id_materia:   parseInt(id_materia),
    }));
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    if (err.status === 409) return errorResponse(res, 409, err.message, req.originalUrl);
    next(err);
  }
}

// PUT /grupos/:id
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nombre_grupo, semestre, id_materia } = req.body;
    if (!validarId(id))
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);
    const errores = validarInput({ nombre_grupo, semestre, id_materia });
    if (errores.length > 0)
      return errorResponse(res, 400, errores.join(' | '), req.originalUrl);
    return res.status(200).json(await gruposService.actualizar(parseInt(id), {
      nombre_grupo: nombre_grupo.trim(),
      semestre:     semestre.trim(),
      id_materia:   parseInt(id_materia),
    }));
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    if (err.status === 409) return errorResponse(res, 409, err.message, req.originalUrl);
    next(err);
  }
}

// DELETE /grupos/:id
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    if (!validarId(id))
      return errorResponse(res, 400, 'El id debe ser un entero positivo', req.originalUrl);
    await gruposService.eliminar(parseInt(id));
    return res.status(204).send();
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    next(err);
  }
}

// POST /grupos/:id/alumnos
async function inscribirAlumno(req, res, next) {
  try {
    const { id } = req.params;
    const { id_alumno } = req.body;
    if (!validarId(id))
      return errorResponse(res, 400, 'El id del grupo debe ser un entero positivo', req.originalUrl);
    if (!id_alumno || isNaN(id_alumno) || parseInt(id_alumno) <= 0)
      return errorResponse(res, 400, 'id_alumno es obligatorio y debe ser un entero positivo', req.originalUrl);
    return res.status(200).json(await gruposService.inscribirAlumno(parseInt(id), parseInt(id_alumno)));
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    if (err.status === 409) return errorResponse(res, 409, err.message, req.originalUrl);
    next(err);
  }
}

// DELETE /grupos/:id/alumnos/:id_alumno
async function quitarAlumno(req, res, next) {
  try {
    const { id, id_alumno } = req.params;
    if (!validarId(id) || !validarId(id_alumno))
      return errorResponse(res, 400, 'Los ids deben ser enteros positivos', req.originalUrl);
    await gruposService.quitarAlumno(parseInt(id), parseInt(id_alumno));
    return res.status(204).send();
  } catch (err) {
    if (err.status === 404) return errorResponse(res, 404, err.message, req.originalUrl);
    next(err);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar, inscribirAlumno, quitarAlumno };
