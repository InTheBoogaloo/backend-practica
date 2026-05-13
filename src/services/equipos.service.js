const db = require('../config/db');

// ─── CREAR ───────────────────────────────────────────────
async function crear({
  id_grupo,
  nombre_equipo,
  id_alumno_creador,
  id_alumnos = []
}) {

  // asegurar array
  const alumnos = Array.isArray(id_alumnos)
    ? id_alumnos
    : [];

  // incluir creador siempre
  const todosLosAlumnos = [
    ...new Set([id_alumno_creador, ...alumnos])
  ];

  // 1. grupo existe
  const grupos = await db.query(
    `SELECT id_grupo
     FROM grupos
     WHERE id_grupo = $1
       AND activo = true`,
    [id_grupo]
  );

  if (grupos.rows.length === 0) {
    const err = new Error(
      `El grupo con id ${id_grupo} no existe`
    );
    err.status = 404;
    throw err;
  }

  // 2. duplicado equipo
  const dup = await db.query(
    `SELECT id_equipo
     FROM equipos
     WHERE id_grupo = $1
       AND nombre_equipo = $2
       AND activo = true`,
    [id_grupo, nombre_equipo]
  );

  if (dup.rows.length > 0) {
    const err = new Error(
      `Ya existe un equipo con el nombre ${nombre_equipo} en este grupo`
    );
    err.status = 409;
    throw err;
  }

  // 3. creador existe
  const creador = await db.query(
    `SELECT id_alumno
     FROM alumnos
     WHERE id_alumno = $1
       AND activo = true`,
    [id_alumno_creador]
  );

  if (creador.rows.length === 0) {
    const err = new Error(
      `El alumno con id ${id_alumno_creador} no existe`
    );
    err.status = 404;
    throw err;
  }

  // 4. validar alumnos
  if (alumnos.length > 0) {

    const existentes = await db.query(
      `SELECT id_alumno
       FROM alumnos
       WHERE id_alumno = ANY($1)
         AND activo = true`,
      [alumnos]
    );

    if (existentes.rows.length !== alumnos.length) {
      const err = new Error(
        `Uno o más alumnos no existen`
      );
      err.status = 404;
      throw err;
    }
  }

  // 5. transacción
  const client = await db.connect();

  try {

    await client.query('BEGIN');

    // INSERT equipo
    const equipoResult = await client.query(
      `INSERT INTO equipos (
          id_grupo,
          nombre_equipo
       )
       VALUES ($1, $2)
       RETURNING id_equipo`,
      [id_grupo, nombre_equipo]
    );

    const id_equipo =
      equipoResult.rows[0].id_equipo;

    // INSERT integrantes
    for (const id_alumno of todosLosAlumnos) {

      await client.query(
        `INSERT INTO alumnos_equipos (
            id_alumno,
            id_equipo,
            es_lider
         )
         VALUES ($1, $2, $3)`,
        [
          id_alumno,
          id_equipo,
          id_alumno === id_alumno_creador
        ]
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

// ─── LISTAR ───────────────────────────────────────────────
async function listar({ id_grupo }) {

  let query = `
    SELECT
      e.id_equipo,
      e.nombre_equipo,
      e.id_grupo,
      g.nombre_grupo,
      COUNT(ae.id_alumno) AS total_integrantes
    FROM equipos e
    JOIN grupos g
      ON g.id_grupo = e.id_grupo
    LEFT JOIN alumnos_equipos ae
      ON ae.id_equipo = e.id_equipo
    WHERE e.activo = true
  `;

  const params = [];

  if (id_grupo) {
    query += ` AND e.id_grupo = $1`;
    params.push(id_grupo);
  }

  query += `
    GROUP BY
      e.id_equipo,
      g.nombre_grupo
    ORDER BY e.id_equipo
  `;

  const result = await db.query(query, params);

  return result.rows;
}

// ─── OBTENER POR ID ───────────────────────────────────────
async function obtenerPorId(id_equipo) {

  const equipos = await db.query(
    `SELECT
        e.id_equipo,
        e.nombre_equipo,
        e.id_grupo,
        g.nombre_grupo
     FROM equipos e
     JOIN grupos g
       ON g.id_grupo = e.id_grupo
     WHERE e.id_equipo = $1
       AND e.activo = true`,
    [id_equipo]
  );

  if (equipos.rows.length === 0) {
    const err = new Error(
      `El equipo con id ${id_equipo} no existe`
    );
    err.status = 404;
    throw err;
  }

  const integrantes = await db.query(
    `SELECT
        a.id_alumno,
        a.matricula,
        a.nombre,
        a.apellido_pat,
        ae.es_lider
     FROM alumnos_equipos ae
     JOIN alumnos a
       ON a.id_alumno = ae.id_alumno
     WHERE ae.id_equipo = $1`,
    [id_equipo]
  );

  return {
    ...equipos.rows[0],
    integrantes: integrantes.rows
  };
}

module.exports = {
  crear,
  listar,
  obtenerPorId
};
