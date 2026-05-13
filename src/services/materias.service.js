const db = require('../config/db');

// ─── LISTAR ─────────────────────────────────────────────
async function listar({
  page = 0,
  size = 10,
  nombre = ''
}) {

  const pageNum = Number.isFinite(+page)
    ? Math.max(0, +page)
    : 0;

  const sizeNum = Number.isFinite(+size)
    ? Math.min(100, +size)
    : 10;

  const offset = pageNum * sizeNum;
  const limit = sizeNum;

  const like = `%${(nombre || '').toString()}%`;

  // ── COUNT ─────────────────────────────
  const countResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM materias
     WHERE activo = true
       AND nombre_materia ILIKE $1`,
    [like]
  );

  const total = Number(
    countResult.rows[0]?.total || 0
  );

  // ── DATA ──────────────────────────────
  const result = await db.query(
    `SELECT
        id_materia,
        clave_materia,
        nombre_materia
     FROM materias
     WHERE activo = true
       AND nombre_materia ILIKE $1
     ORDER BY id_materia ASC
     LIMIT $2 OFFSET $3`,
    [like, limit, offset]
  );

  return {
    page: pageNum,
    size: sizeNum,
    totalElements: total,
    totalPages: Math.ceil(total / sizeNum),
    content: result.rows || [],
  };
}

// ─── OBTENER ─────────────────────────────────────────────
async function obtenerPorId(id) {

  const idNum = Number(id);

  if (!Number.isFinite(idNum)) {
    const err = new Error('ID inválido');
    err.status = 400;
    throw err;
  }

  const result = await db.query(
    `SELECT
        id_materia,
        clave_materia,
        nombre_materia
     FROM materias
     WHERE id_materia = $1
       AND activo = true
     LIMIT 1`,
    [idNum]
  );

  if (result.rows.length === 0) {
    const err = new Error(
      `La materia con id ${id} no existe`
    );
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

// ─── CREAR ──────────────────────────────────────────────
async function crear({
  clave_materia,
  nombre_materia
}) {

  if (!clave_materia || !nombre_materia) {
    const err = new Error(
      'Datos incompletos'
    );
    err.status = 400;
    throw err;
  }

  // validar duplicado
  const dup = await db.query(
    `SELECT id_materia
     FROM materias
     WHERE clave_materia = $1
        OR nombre_materia = $2
     LIMIT 1`,
    [clave_materia, nombre_materia]
  );

  if (dup.rows.length > 0) {
    const err = new Error(
      'Materia duplicada'
    );
    err.status = 409;
    throw err;
  }

  // INSERT
  const result = await db.query(
    `INSERT INTO materias (
        clave_materia,
        nombre_materia
     )
     VALUES ($1, $2)
     RETURNING id_materia`,
    [clave_materia, nombre_materia]
  );

  const id_materia =
    result.rows[0].id_materia;

  return obtenerPorId(id_materia);
}

// ─── ACTUALIZAR ─────────────────────────────────────────
async function actualizar(
  id,
  {
    clave_materia,
    nombre_materia
  }
) {

  await obtenerPorId(id);

  // validar duplicado
  const dup = await db.query(
    `SELECT id_materia
     FROM materias
     WHERE (
       clave_materia = $1
       OR nombre_materia = $2
     )
       AND id_materia != $3
     LIMIT 1`,
    [
      clave_materia,
      nombre_materia,
      id
    ]
  );

  if (dup.rows.length > 0) {
    const err = new Error(
      'Conflicto: duplicado'
    );
    err.status = 409;
    throw err;
  }

  // UPDATE
  await db.query(
    `UPDATE materias
     SET
       clave_materia = $1,
       nombre_materia = $2
     WHERE id_materia = $3`,
    [
      clave_materia,
      nombre_materia,
      id
    ]
  );

  return obtenerPorId(id);
}

// ─── ELIMINAR ───────────────────────────────────────────
async function eliminar(id) {

  await obtenerPorId(id);

  await db.query(
    `UPDATE materias
     SET activo = false
     WHERE id_materia = $1`,
    [id]
  );
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
