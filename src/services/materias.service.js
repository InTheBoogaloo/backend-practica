const db = require('../config/db');

// ─── LISTAR ─────────────────────────────────────────────
async function listar({ page = 0, size = 10, nombre = '' }) {
  const pageNum = Number.isFinite(+page) ? Math.max(0, +page) : 0;
  const sizeNum = Number.isFinite(+size) ? Math.min(100, +size) : 10;

  const offset = pageNum * sizeNum;
  const limit = sizeNum;

  const like = `%${(nombre || '').toString()}%`;

  // ── COUNT ─────────────────────────────
  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM materias
     WHERE activo = 1
     AND nombre_materia LIKE ?`,
    [like]
  );

  const total = countRow?.total || 0;

  // ── DATA ──────────────────────────────
  const [rows] = await db.query(
    `SELECT id_materia, clave_materia, nombre_materia
     FROM materias
     WHERE activo = 1
     AND nombre_materia LIKE ?
     ORDER BY id_materia ASC
     LIMIT ? OFFSET ?`,
    [like, limit, offset]
  );

  return {
    page: pageNum,
    size: sizeNum,
    totalElements: total,
    totalPages: Math.ceil(total / sizeNum),
    content: rows || [],
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

  const [rows] = await db.query(
    `SELECT id_materia, clave_materia, nombre_materia
     FROM materias
     WHERE id_materia = ? AND activo = 1
     LIMIT 1`,
    [idNum]
  );

  if (!rows.length) {
    const err = new Error(`La materia con id ${id} no existe`);
    err.status = 404;
    throw err;
  }

  return rows[0];
}

// ─── CREAR ──────────────────────────────────────────────
async function crear({ clave_materia, nombre_materia }) {
  if (!clave_materia || !nombre_materia) {
    const err = new Error('Datos incompletos');
    err.status = 400;
    throw err;
  }

  const [dup] = await db.query(
    `SELECT id_materia FROM materias
     WHERE clave_materia = ? OR nombre_materia = ?
     LIMIT 1`,
    [clave_materia, nombre_materia]
  );

  if (dup.length > 0) {
    const err = new Error('Materia duplicada');
    err.status = 409;
    throw err;
  }

  const [result] = await db.query(
    `INSERT INTO materias (clave_materia, nombre_materia)
     VALUES (?, ?)`,
    [clave_materia, nombre_materia]
  );

  return obtenerPorId(result.insertId);
}

// ─── ACTUALIZAR ─────────────────────────────────────────
async function actualizar(id, { clave_materia, nombre_materia }) {
  const materia = await obtenerPorId(id);

  const [dup] = await db.query(
    `SELECT id_materia FROM materias
     WHERE (clave_materia = ? OR nombre_materia = ?)
     AND id_materia != ?
     LIMIT 1`,
    [clave_materia, nombre_materia, id]
  );

  if (dup.length > 0) {
    const err = new Error('Conflicto: duplicado');
    err.status = 409;
    throw err;
  }

  await db.query(
    `UPDATE materias
     SET clave_materia = ?, nombre_materia = ?
     WHERE id_materia = ?`,
    [clave_materia, nombre_materia, id]
  );

  return obtenerPorId(id);
}

// ─── ELIMINAR ───────────────────────────────────────────
async function eliminar(id) {
  await obtenerPorId(id);

  await db.query(
    `UPDATE materias SET activo = 0 WHERE id_materia = ?`,
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
