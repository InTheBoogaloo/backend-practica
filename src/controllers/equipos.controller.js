const equiposService = require('../services/equipos.service');

const PATH = '/api/v1/equipos';

function err(res, status, message) {
  const map = { 400: 'Bad Request', 404: 'Not Found', 409: 'Conflict' };
  return res.status(status).json({ timestamp: new Date().toISOString(), status, error: map[status] || 'Error', message, path: PATH });
}

async function crear(req, res, next) {
  try {
    const { id_grupo, nombre_equipo, id_alumno_creador = null, id_alumnos = [] } = req.body;

    if (!id_grupo || !nombre_equipo) return err(res, 400, 'Los campos id_grupo y nombre_equipo son obligatorios');
    if (!Array.isArray(id_alumnos)) return err(res, 400, 'El campo id_alumnos debe ser un arreglo');
    if (nombre_equipo.trim().length < 3 || nombre_equipo.trim().length > 100)
      return err(res, 400, 'nombre_equipo debe tener entre 3 y 100 caracteres');

    const equipo = await equiposService.crear({
      id_grupo: parseInt(id_grupo),
      nombre_equipo: nombre_equipo.trim(),
      id_alumno_creador: id_alumno_creador ? parseInt(id_alumno_creador) : null,
      id_alumnos: id_alumnos.map(Number),
    });
    res.status(201).json(equipo);
  } catch (e) {
    if (e.status === 400) return err(res, 400, e.message);
    if (e.status === 404) return err(res, 404, e.message);
    if (e.status === 409) return err(res, 409, e.message);
    next(e);
  }
}

async function listar(req, res, next) {
  try {
    const { id_grupo } = req.query;
    res.json(await equiposService.listar({ id_grupo: id_grupo ? parseInt(id_grupo) : null }));
  } catch (e) { next(e); }
}

async function obtener(req, res, next) {
  try {
    res.json(await equiposService.obtenerPorId(parseInt(req.params.id)));
  } catch (e) {
    if (e.status === 404) return err(res, 404, e.message);
    next(e);
  }
}

async function actualizar(req, res, next) {
  try {
    const { nombre_equipo, id_grupo } = req.body;
    if (!nombre_equipo || !id_grupo) return err(res, 400, 'Los campos nombre_equipo e id_grupo son obligatorios');
    if (nombre_equipo.trim().length < 3 || nombre_equipo.trim().length > 100)
      return err(res, 400, 'nombre_equipo debe tener entre 3 y 100 caracteres');

    res.json(await equiposService.actualizar(parseInt(req.params.id), {
      nombre_equipo: nombre_equipo.trim(),
      id_grupo: parseInt(id_grupo),
    }));
  } catch (e) {
    if (e.status === 404) return err(res, 404, e.message);
    if (e.status === 409) return err(res, 409, e.message);
    next(e);
  }
}

async function eliminar(req, res, next) {
  try {
    await equiposService.eliminar(parseInt(req.params.id));
    res.status(204).send();
  } catch (e) {
    if (e.status === 404) return err(res, 404, e.message);
    next(e);
  }
}

module.exports = { crear, listar, obtener, actualizar, eliminar };