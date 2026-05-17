const db = require('../config/db');

async function crear({ id_grupo, nombre_equipo, id_alumno_creador = null, id_alumnos = [] }) {
  const alumnos = Array.isArray(id_alumnos) ? id_alumnos : [];

  // 1. Grupo existe
  const grupos = await db.query(
    `SELECT id_grupo FROM grupos WHERE id_grupo = $1 AND activo = true`,
    [id_grupo]
  );
  if (grupos.rows.length === 0) {
    const err = new Error(`El grupo con id ${id_grupo} no existe`);
    err.status = 404; throw err;
  }

  // 2. Duplicado
  const dup = await db.query(
    `SELECT id_equipo FROM equipos WHERE id_grupo = $1 AND nombre_equipo = $2 AND activo = true`,
    [id_grupo, nombre_equipo]
  );
  if (dup.rows.length > 0) {
    const err = new Error(`Ya existe un equipo con el nombre ${nombre_equipo} en este grupo`);
    err.status = 409; throw err;
  }

  // 3. Validar creador solo si viene
  if (id_alumno_creador) {
    const creador = await db.query(
      `SELECT id_alumno FROM alumnos WHERE id_alumno = $1 AND activo = true`,
      [id_alumno_creador]
    );
    if (creador.rows.length === 0) {
      const err = new Error(`El alumno con id ${id_alumno_creador} no existe`);
      err.status = 404; throw err;
    }
  }

  // 4. Validar alumnos adicionales
  if (alumnos.length > 0) {
    const existentes = await db.query(
      `SELECT id_alumno FROM alumnos WHERE id_alumno = ANY($1) AND activo = true`,
      [alumnos]
    );
    if (existentes.rows.length !== alumnos.length) {
      const err = new Error(`Uno o más alumnos no existen`);
      err.status = 404; throw err;
    }
  }

  // 5. Construir lista de integrantes
  const todosLosAlumnos = id_alumno_creador
    ? [...new Set([id_alumno_creador, ...alumnos])]
    : [...new Set(alumnos)];

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const equipoResult = await client.query(
      `INSERT INTO equipos (id_grupo, nombre_equipo) VALUES ($1, $2) RETURNING id_equipo`,
      [id_grupo, nombre_equipo]
    );
    const id_equipo = equipoResult.rows[0].id_equipo;

    for (const id_alumno of todosLosAlumnos) {
      await client.query(
        `INSERT INTO alumnos_equipos (id_alumno, id_equipo, es_lider) VALUES ($1, $2, $3)`,
        [id_alumno, id_equipo, id_alumno === id_alumno_creador]
      );
    }

    await client.query('COMMIT');
    return obtenerPorId(id_equipo);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listar({ id_grupo }) {
  let query = `
    SELECT e.id_equipo, e.nombre_equipo, e.id_grupo, g.nombre_grupo,
           COUNT(ae.id_alumno) AS total_integrantes
    FROM equipos e
    JOIN grupos g ON g.id_grupo = e.id_grupo
    LEFT JOIN alumnos_equipos ae ON ae.id_equipo = e.id_equipo
    WHERE e.activo = true
  `;
  const params = [];
  if (id_grupo) { query += ` AND e.id_grupo = $1`; params.push(id_grupo); }
  query += ` GROUP BY e.id_equipo, g.nombre_grupo ORDER BY e.id_equipo`;
  const result = await db.query(query, params);
  return result.rows;
}

async function obtenerPorId(id_equipo) {
  const equipos = await db.query(
    `SELECT e.id_equipo, e.nombre_equipo, e.id_grupo, g.nombre_grupo
     FROM equipos e
     JOIN grupos g ON g.id_grupo = e.id_grupo
     WHERE e.id_equipo = $1 AND e.activo = true`,
    [id_equipo]
  );
  if (equipos.rows.length === 0) {
    const err = new Error(`El equipo con id ${id_equipo} no existe`);
    err.status = 404; throw err;
  }
  const integrantes = await db.query(
    `SELECT a.id_alumno, a.matricula, a.nombre, a.apellido_pat, ae.es_lider
     FROM alumnos_equipos ae
     JOIN alumnos a ON a.id_alumno = ae.id_alumno
     WHERE ae.id_equipo = $1`,
    [id_equipo]
  );
  return { ...equipos.rows[0], integrantes: integrantes.rows };
}

async function actualizar(id_equipo, { nombre_equipo, id_grupo }) {
  await obtenerPorId(id_equipo);

  // Verificar grupo
  const grupo = await db.query(
    `SELECT id_grupo FROM grupos WHERE id_grupo = $1 AND activo = true`,
    [id_grupo]
  );
  if (grupo.rows.length === 0) {
    const err = new Error(`El grupo con id ${id_grupo} no existe`);
    err.status = 404; throw err;
  }

  // Duplicado en el grupo (excluyendo el actual)
  const dup = await db.query(
    `SELECT id_equipo FROM equipos WHERE id_grupo = $1 AND nombre_equipo = $2 AND id_equipo != $3 AND activo = true`,
    [id_grupo, nombre_equipo, id_equipo]
  );
  if (dup.rows.length > 0) {
    const err = new Error(`Ya existe un equipo con el nombre ${nombre_equipo} en ese grupo`);
    err.status = 409; throw err;
  }

  await db.query(
    `UPDATE equipos SET nombre_equipo = $1, id_grupo = $2 WHERE id_equipo = $3`,
    [nombre_equipo, id_grupo, id_equipo]
  );
  return obtenerPorId(id_equipo);
}

async function eliminar(id_equipo) {
  await obtenerPorId(id_equipo);
  await db.query(`UPDATE equipos SET activo = false WHERE id_equipo = $1`, [id_equipo]);
}

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar };