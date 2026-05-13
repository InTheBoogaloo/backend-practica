const db = require('../config/db');

// ─── CREAR ───────────────────────────────────────────────
async function crear({ id_grupo, nombre_equipo, id_alumno_creador, id_alumnos = [] }) {
  // asegurar array
  const alumnos = Array.isArray(id_alumnos) ? id_alumnos : [];

  // incluir creador siempre
  const todosLosAlumnos = [...new Set([id_alumno_creador, ...alumnos])];

  // 1. grupo existe
  const [grupos] = await db.query(
    'SELECT id_grupo FROM grupos WHERE id_grupo = ? AND activo = 1',
    [id_grupo]
  );

  if (grupos.length === 0) {
    const err = new Error(`El grupo con id ${id_grupo} no existe`);
    err.status = 404;
    throw err;
  }

  // 2. duplicado equipo
  const [dup] = await db.query(
    'SELECT id_equipo FROM equipos WHERE id_grupo = ? AND nombre_equipo = ? AND activo = 1',
    [id_grupo, nombre_equipo]
  );

  if (dup.length > 0) {
    const err = new Error(`Ya existe un equipo con el nombre ${nombre_equipo} en este grupo`);
    err.status = 409;
    throw err;
  }

  // 3. creador existe
  const [creador] = await db.query(
    'SELECT id_alumno FROM alumnos WHERE id_alumno = ? AND activo = 1',
    [id_alumno_creador]
  );

  if (creador.length === 0) {
    const err = new Error(`El alumno con id ${id_alumno_creador} no existe`);
    err.status = 404;
    throw err;
  }

  // 4. validar alumnos en batch (MEJOR QUE LOOP)
  if (alumnos.length > 0) {
    const [existentes] = await db.query(
      `SELECT id_alumno FROM alumnos
       WHERE id_alumno IN (?) AND activo = 1`,
      [alumnos]
    );

    if (existentes.length !== alumnos.length) {
      const err = new Error(`Uno o más alumnos no existen`);
      err.status = 404;
      throw err;
    }
  }

  // 5. transacción
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [equipoResult] = await conn.query(
      'INSERT INTO equipos (id_grupo, nombre_equipo) VALUES (?, ?)',
      [id_grupo, nombre_equipo]
    );

    const id_equipo = equipoResult.insertId;

    // INSERT masivo (MEJOR RENDIMIENTO)
    const values = todosLosAlumnos.map(id => [
      id,
      id_equipo,
      id === id_alumno_creador ? 1 : 0
    ]);

    await conn.query(
      'INSERT INTO alumnos_equipos (id_alumno, id_equipo, es_lider) VALUES ?',
      [values]
    );

    await conn.commit();

    return obtenerPorId(id_equipo);

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── LISTAR ───────────────────────────────────────────────
async function listar({ id_grupo }) {
  let query = `
    SELECT e.id_equipo, e.nombre_equipo, e.id_grupo, g.nombre_grupo,
           COUNT(ae.id_alumno) AS total_integrantes
      FROM equipos e
      JOIN grupos g ON g.id_grupo = e.id_grupo
      LEFT JOIN alumnos_equipos ae ON ae.id_equipo = e.id_equipo
     WHERE e.activo = 1
  `;

  const params = [];

  if (id_grupo) {
    query += ' AND e.id_grupo = ?';
    params.push(id_grupo);
  }

  query += ' GROUP BY e.id_equipo ORDER BY e.id_equipo';

  const [rows] = await db.query(query, params);
  return rows;
}

// ─── OBTENER POR ID ───────────────────────────────────────
async function obtenerPorId(id_equipo) {
  const [equipos] = await db.query(
    `SELECT e.id_equipo, e.nombre_equipo, e.id_grupo, g.nombre_grupo
       FROM equipos e
       JOIN grupos g ON g.id_grupo = e.id_grupo
      WHERE e.id_equipo = ? AND e.activo = 1`,
    [id_equipo]
  );

  if (equipos.length === 0) {
    const err = new Error(`El equipo con id ${id_equipo} no existe`);
    err.status = 404;
    throw err;
  }

  const [integrantes] = await db.query(
    `SELECT a.id_alumno, a.matricula, a.nombre, a.apellido_pat, ae.es_lider
       FROM alumnos_equipos ae
       JOIN alumnos a ON a.id_alumno = ae.id_alumno
      WHERE ae.id_equipo = ?`,
    [id_equipo]
  );

  return { ...equipos[0], integrantes };
}

module.exports = { crear, listar, obtenerPorId };
