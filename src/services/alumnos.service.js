const db = require('../config/db');

// ─── Listar ───────────────────────────────────────────────────
async function listar({ page = 0, size = 10, nombre = '' }) {
  const offset = parseInt(page) * parseInt(size);
  const limit  = parseInt(size);
  const like   = `%${nombre}%`;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM alumnos
      WHERE activo = 1
        AND (nombre LIKE ? OR apellido_pat LIKE ? OR matricula LIKE ?)`,
    [like, like, like]
  );

  const [rows] = await db.query(
    `SELECT id_alumno, matricula, nombre, apellido_pat, apellido_mat, email
       FROM alumnos
      WHERE activo = 1
        AND (nombre LIKE ? OR apellido_pat LIKE ? OR matricula LIKE ?)
      ORDER BY id_alumno ASC
      LIMIT ? OFFSET ?`,
    [like, like, like, limit, offset]
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
    `SELECT id_alumno, matricula, nombre, apellido_pat, apellido_mat, email
       FROM alumnos
      WHERE id_alumno = ? AND activo = 1 LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    const err = new Error(`El alumno con id ${id} no existe`);
    err.status = 404;
    throw err;
  }

  return rows[0];
}

// ─── Crear ────────────────────────────────────────────────────
async function crear({ matricula, nombre, apellido_pat, apellido_mat = null, email, password }) {
  // Verificar matrícula duplicada
  const [porMatricula] = await db.query(
    'SELECT id_alumno FROM alumnos WHERE matricula = ? LIMIT 1',
    [matricula]
  );
  if (porMatricula.length > 0) {
    const err = new Error(`Ya existe un alumno con la matrícula ${matricula}`);
    err.status = 409;
    throw err;
  }

  // Verificar email duplicado
  const [porEmail] = await db.query(
    'SELECT id_alumno FROM alumnos WHERE email = ? LIMIT 1',
    [email]
  );
  if (porEmail.length > 0) {
    const err = new Error(`Ya existe un alumno con el email ${email}`);
    err.status = 409;
    throw err;
  }

  // Verificar username duplicado en usuarios
  const username = matricula.toLowerCase();
  const [porUsername] = await db.query(
    'SELECT id_usuario FROM usuarios WHERE username = ? LIMIT 1',
    [username]
  );
  if (porUsername.length > 0) {
    const err = new Error(`Ya existe un usuario con el username ${username}`);
    err.status = 409;
    throw err;
  }

  const bcrypt = require('bcryptjs');
  const hash   = await bcrypt.hash(password, 10);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insertar en alumnos
    const [resAlumno] = await conn.query(
      `INSERT INTO alumnos (matricula, nombre, apellido_pat, apellido_mat, email)
       VALUES (?, ?, ?, ?, ?)`,
      [matricula, nombre, apellido_pat, apellido_mat, email]
    );

    // Insertar en usuarios vinculado al alumno
    await conn.query(
      `INSERT INTO usuarios (username, password_hash, rol, id_alumno)
       VALUES (?, ?, 'ALUMNO', ?)`,
      [username, hash, resAlumno.insertId]
    );

    await conn.commit();
    return obtenerPorId(resAlumno.insertId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── Actualizar ───────────────────────────────────────────────
async function actualizar(id, { nombre, apellido_pat, apellido_mat = null, email }) {
  await obtenerPorId(id);

  const [porEmail] = await db.query(
    'SELECT id_alumno FROM alumnos WHERE email = ? AND id_alumno != ? LIMIT 1',
    [email, id]
  );
  if (porEmail.length > 0) {
    const err = new Error(`Ya existe un alumno con el email ${email}`);
    err.status = 409;
    throw err;
  }

  await db.query(
    `UPDATE alumnos SET nombre = ?, apellido_pat = ?, apellido_mat = ?, email = ?
      WHERE id_alumno = ?`,
    [nombre, apellido_pat, apellido_mat, email, id]
  );

  return obtenerPorId(id);
}

// ─── Eliminar (soft delete) ───────────────────────────────────
async function eliminar(id) {
  await obtenerPorId(id);
  await db.query('UPDATE alumnos SET activo = 0 WHERE id_alumno = ?', [id]);
  await db.query('UPDATE usuarios SET activo = 0 WHERE id_alumno = ?', [id]);
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
