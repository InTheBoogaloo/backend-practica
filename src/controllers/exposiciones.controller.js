const service = require('../services/exposiciones.service');

// ─── LISTAR ───────────────────────────────────────────────
async function listar(req, res, next) {
  try {
    const { page, size, titulo, id_equipo } = req.query;

    const data = await service.listar({
      page,
      size,
      titulo,
      id_equipo: id_equipo ? Number(id_equipo) : null
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ─── OBTENER POR ID ───────────────────────────────────────
async function obtenerPorId(req, res, next) {
  try {
    const { id } = req.params;
    const data = await service.obtenerPorId(Number(id));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ─── CREAR ────────────────────────────────────────────────
async function crear(req, res, next) {
  try {
    const {
      id_equipo,
      id_rubrica,
      titulo,
      fecha_exposicion,
      descripcion
    } = req.body;

    const data = await service.crear({
      id_equipo,
      id_rubrica,
      titulo,
      fecha_exposicion,
      descripcion
    });

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

// ─── ACTUALIZAR ───────────────────────────────────────────
async function actualizar(req, res, next) {
  try {
    const { id } = req.params;
    const {
      id_equipo,
      id_rubrica,
      titulo,
      fecha_exposicion,
      descripcion
    } = req.body;

    const data = await service.actualizar(Number(id), {
      id_equipo,
      id_rubrica,
      titulo,
      fecha_exposicion,
      descripcion
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

// ─── ELIMINAR ─────────────────────────────────────────────
async function eliminar(req, res, next) {
  try {
    const { id } = req.params;
    await service.eliminar(Number(id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
