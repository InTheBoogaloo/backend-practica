const db = require('../config/db');

// ─── Listar (paginado + filtro por nombre) ────────────────────
async function listar({ page = 0, size = 10, nombre = '' }) {
  const offset = parseInt(page) * parseInt(size);
  const limit  = parseInt(size);
  const like   = `%${nombre}%`;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
       FROM materias
      WHERE nombre_materia LIKE ? AND activo = 1`,
    [like]
  );

  const [rows] = await db.query(
    `SELECT id_materia, clave_materia, nombre_materia
       FROM materias
      WHERE nombre_materia LIKE ? AND activo = 1
      ORDER BY id_materia ASC
      LIMIT ? OFFSET ?`,
    [like, limit, offset]
  );

  return {
    page:          parseInt(page),
    size:          limit,
    totalElements: total,
    totalPages:    Math.ceil(total / limit),
    content:       rows,
  };
}

// ─── Obtener por ID ───────────────────────────────────────────
async function obtenerPorId(id) {
  const [rows] = await db.query(
    `SELECT id_materia, clave_materia, nombre_materia
       FROM materias
      WHERE id_materia = ? AND activo = 1
      LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    const err = new Error(`La materia con id ${id} no existe`);
    err.status = 404;
    throw err;
  }

  return rows[0];
}

// ─── Crear ────────────────────────────────────────────────────
async function crear({ clave_materia, nombre_materia }) {
  // Verificar duplicado de clave
  const [porClave] = await db.query(
    'SELECT id_materia FROM materias WHERE clave_materia = ? LIMIT 1',
    [clave_materia]
  );
  if (porClave.length > 0) {
    const err = new Error(`Ya existe una materia con la clave ${clave_materia}`);
    err.status = 409;
    throw err;
  }

  // Verificar duplicado de nombre
  const [porNombre] = await db.query(
    'SELECT id_materia FROM materias WHERE nombre_materia = ? LIMIT 1',
    [nombre_materia]
  );
  if (porNombre.length > 0) {
    const err = new Error(`Ya existe una materia con el nombre ${nombre_materia}`);
    err.status = 409;
    throw err;
  }

  const [result] = await db.query(
    'INSERT INTO materias (clave_materia, nombre_materia) VALUES (?, ?)',
    [clave_materia, nombre_materia]
  );

  return obtenerPorId(result.insertId);
}

// ─── Actualizar ───────────────────────────────────────────────
async function actualizar(id, { clave_materia, nombre_materia }) {
  // Verificar que existe
  await obtenerPorId(id);

  // Verificar duplicado de clave (excluyendo la misma materia)
  const [porClave] = await db.query(
    'SELECT id_materia FROM materias WHERE clave_materia = ? AND id_materia != ? LIMIT 1',
    [clave_materia, id]
  );
  if (porClave.length > 0) {
    const err = new Error(`Ya existe una materia con la clave ${clave_materia}`);
    err.status = 409;
    throw err;
  }

  // Verificar duplicado de nombre (excluyendo la misma materia)
  const [porNombre] = await db.query(
    'SELECT id_materia FROM materias WHERE nombre_materia = ? AND id_materia != ? LIMIT 1',
    [nombre_materia, id]
  );
  if (porNombre.length > 0) {
    const err = new Error(`Ya existe una materia con el nombre ${nombre_materia}`);
    err.status = 409;
    throw err;
  }

  await db.query(
    'UPDATE materias SET clave_materia = ?, nombre_materia = ? WHERE id_materia = ?',
    [clave_materia, nombre_materia, id]
  );

  return obtenerPorId(id);
}

// ─── Eliminar (soft delete) ───────────────────────────────────
async function eliminar(id) {
  // Verificar que existe
  await obtenerPorId(id);

  await db.query(
    'UPDATE materias SET activo = 0 WHERE id_materia = ?',
    [id]
  );
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
