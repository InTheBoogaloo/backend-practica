const db = require('../config/db');

/**
 * Lista materias con paginación y filtro opcional por nombre.
 * @param {object} params - { page, size, nombre }
 * @returns {object} Resultado paginado { page, size, totalElements, totalPages, content }
 */
async function listar({ page = 0, size = 10, nombre = '' }) {
  const pageNum = Math.max(0, parseInt(page) || 0);
  const sizeNum = Math.min(100, Math.max(1, parseInt(size) || 10));
  const offset  = pageNum * sizeNum;
  const like    = `%${nombre}%`;

  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM materias WHERE nombre_materia LIKE ?',
    [like]
  );

  const [rows] = await db.query(
    'SELECT id_materia, clave_materia, nombre_materia FROM materias WHERE nombre_materia LIKE ? ORDER BY id_materia LIMIT ? OFFSET ?',
    [like, sizeNum, offset]
  );

  return {
    page:          pageNum,
    size:          sizeNum,
    totalElements: total,
    totalPages:    Math.ceil(total / sizeNum),
    content:       rows,
  };
}

/**
 * Obtiene una materia por su ID.
 * @param {number} id
 * @returns {object} Materia encontrada
 * @throws Error con status 404 si no existe
 */
async function obtenerPorId(id) {
  const [rows] = await db.query(
    'SELECT id_materia, clave_materia, nombre_materia FROM materias WHERE id_materia = ?',
    [id]
  );

  if (rows.length === 0) {
    const err = new Error(`La materia con id ${id} no existe`);
    err.status = 404;
    throw err;
  }

  return rows[0];
}

/**
 * Crea una nueva materia.
 * @param {object} data - { clave_materia, nombre_materia }
 * @returns {object} Materia creada
 * @throws Error con status 409 si la clave o nombre ya existe
 */
async function crear({ clave_materia, nombre_materia }) {
  // Verificar duplicados
  const [dup] = await db.query(
    'SELECT id_materia FROM materias WHERE clave_materia = ? OR nombre_materia = ?',
    [clave_materia, nombre_materia]
  );

  if (dup.length > 0) {
    const err = new Error(`Ya existe una materia con la clave ${clave_materia} o el nombre ${nombre_materia}`);
    err.status = 409;
    throw err;
  }

  const [result] = await db.query(
    'INSERT INTO materias (clave_materia, nombre_materia) VALUES (?, ?)',
    [clave_materia, nombre_materia]
  );

  return obtenerPorId(result.insertId);
}

/**
 * Actualiza una materia existente.
 * @param {number} id
 * @param {object} data - { clave_materia, nombre_materia }
 * @returns {object} Materia actualizada
 * @throws Error con status 404 si no existe, 409 si hay conflicto
 */
async function actualizar(id, { clave_materia, nombre_materia }) {
  // Verificar que existe
  await obtenerPorId(id);

  // Verificar duplicados excluyendo el registro actual
  const [dup] = await db.query(
    'SELECT id_materia FROM materias WHERE (clave_materia = ? OR nombre_materia = ?) AND id_materia != ?',
    [clave_materia, nombre_materia, id]
  );

  if (dup.length > 0) {
    const err = new Error(`Ya existe otra materia con la clave ${clave_materia} o el nombre ${nombre_materia}`);
    err.status = 409;
    throw err;
  }

  await db.query(
    'UPDATE materias SET clave_materia = ?, nombre_materia = ? WHERE id_materia = ?',
    [clave_materia, nombre_materia, id]
  );

  return obtenerPorId(id);
}

/**
 * Elimina una materia por su ID.
 * @param {number} id
 * @throws Error con status 404 si no existe
 */
async function eliminar(id) {
  // Verificar que existe (lanza 404 si no)
  await obtenerPorId(id);

  await db.query('DELETE FROM materias WHERE id_materia = ?', [id]);
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
