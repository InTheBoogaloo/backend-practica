const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ─── LISTAR ───────────────────────────────────────────────
async function listar({ page = 0, size = 10, nombre = '' }) {
  const pageNum = Number(page) || 0;
  const sizeNum = Number(size) || 10;

  const limit = Math.max(1, sizeNum);
  const offset = Math.max(0, pageNum * sizeNum);

  const like = `%${nombre ?? ''}%`;

  // TOTAL
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM alumnos
     WHERE activo = true
       AND (
         nombre ILIKE $1
         OR apellido_pat ILIKE $2
         OR matricula ILIKE $3
       )`,
    [like, like, like]
  );

  const total = Number(totalResult.rows[0].total);

  // DATA
  const result = await db.query(
    `SELECT
        id_alumno,
        matricula,
        nombre,
        apellido_pat,
        apellido_mat,
        email
     FROM alumnos
     WHERE activo = true
       AND (
         nombre ILIKE $1
         OR apellido_pat ILIKE $2
         OR matricula ILIKE $3
       )
     ORDER BY id_alumno ASC
     LIMIT $4 OFFSET $5`,
    [like, like, like, limit, offset]
  );

  return {
    page: pageNum,
    size: limit,
    totalElements: total,
    totalPages: Math.ceil(total / limit),
    content: result.rows,
  };
}

// ─── OBTENER POR ID ───────────────────────────────────────
async function obtenerPorId(id) {
  const result = await db.query(
    `SELECT
        id_alumno,
        matricula,
        nombre,
        apellido_pat,
        apellido_mat,
        email
     FROM alumnos
     WHERE id_alumno = $1
       AND activo = true
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    const err = new Error(`El alumno con id ${id} no existe`);
    err.status = 404;
    throw err;
  }

  return result.rows[0];
}

// ─── CREAR ────────────────────────────────────────────────
async function crear({
  matricula,
  nombre,
  apellido_pat,
  apellido_mat = null,
  email,
  password
}) {

  // Verificar matrícula
  const porMatricula = await db.query(
    `SELECT id_alumno
     FROM alumnos
     WHERE matricula = $1
     LIMIT 1`,
    [matricula]
  );

  if (porMatricula.rows.length > 0) {
    const err = new Error(
      `Ya existe un alumno con la matrícula ${matricula}`
    );
    err.status = 409;
    throw err;
  }

  // Verificar email
  const porEmail = await db.query(
    `SELECT id_alumno
     FROM alumnos
     WHERE email = $1
     LIMIT 1`,
    [email]
  );

  if (porEmail.rows.length > 0) {
    const err = new Error(
      `Ya existe un alumno con el email ${email}`
    );
    err.status = 409;
    throw err;
  }

  const username = matricula.toLowerCase();

  // Verificar username
  const porUsername = await db.query(
    `SELECT id_usuario
     FROM usuarios
     WHERE username = $1
     LIMIT 1`,
    [username]
  );

  if (porUsername.rows.length > 0) {
    const err = new Error(
      `Ya existe un usuario con el username ${username}`
    );
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);

  const client = await db.connect();

  try {

    await client.query('BEGIN');

    // INSERT alumno
    const resAlumno = await client.query(
      `INSERT INTO alumnos (
          matricula,
          nombre,
          apellido_pat,
          apellido_mat,
          email
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_alumno`,
      [
        matricula,
        nombre,
        apellido_pat,
        apellido_mat,
        email
      ]
    );

    const idAlumno = resAlumno.rows[0].id_alumno;

    // INSERT usuario
    await client.query(
      `INSERT INTO usuarios (
          username,
          password_hash,
          rol,
          id_alumno
       )
       VALUES ($1, $2, $3, $4)`,
      [
        username,
        hash,
        'ALUMNO',
        idAlumno
      ]
    );

    await client.query('COMMIT');

    return obtenerPorId(idAlumno);

  } catch (err) {

    await client.query('ROLLBACK');
    throw err;

  } finally {

    client.release();

  }
}

// ─── ACTUALIZAR ───────────────────────────────────────────
async function actualizar(
  id,
  {
    nombre,
    apellido_pat,
    apellido_mat = null,
    email
  }
) {

  await obtenerPorId(id);

  // Verificar email duplicado
  const porEmail = await db.query(
    `SELECT id_alumno
     FROM alumnos
     WHERE email = $1
       AND id_alumno != $2
     LIMIT 1`,
    [email, id]
  );

  if (porEmail.rows.length > 0) {
    const err = new Error(
      `Ya existe un alumno con el email ${email}`
    );
    err.status = 409;
    throw err;
  }

  // UPDATE
  await db.query(
    `UPDATE alumnos
     SET
       nombre = $1,
       apellido_pat = $2,
       apellido_mat = $3,
       email = $4
     WHERE id_alumno = $5`,
    [
      nombre,
      apellido_pat,
      apellido_mat,
      email,
      id
    ]
  );

  return obtenerPorId(id);
}

// ─── ELIMINAR (SOFT DELETE) ───────────────────────────────
async function eliminar(id) {

  await obtenerPorId(id);

  await db.query(
    `UPDATE alumnos
     SET activo = false
     WHERE id_alumno = $1`,
    [id]
  );

  await db.query(
    `UPDATE usuarios
     SET activo = false
     WHERE id_alumno = $1`,
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
