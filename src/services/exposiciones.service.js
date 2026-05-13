const db = require('../config/db');

// ─── LISTAR ───────────────────────────────────────────────
async function listar({
  page = 0,
  size = 10,
  titulo = '',
  id_equipo = null
}) {

  const pageNum = Number(page) || 0;
  const sizeNum = Number(size) || 10;

  const limit  = Math.max(1, sizeNum);
  const offset = Math.max(0, pageNum * sizeNum);

  const like = `%${titulo ?? ''}%`;

  // ── BUILD WHERE ──────────────────────────────────────
  const conditions = [
    `e.activo = true`,
    `e.titulo ILIKE $1`
  ];

  const params = [like];

  if (id_equipo) {
    params.push(id_equipo);
    conditions.push(`e.id_equipo = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  // ── TOTAL ────────────────────────────────────────────
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM exposiciones e
     WHERE ${where}`,
    params
  );

  const total = Number(totalResult.rows[0].total);

  // ── DATA ─────────────────────────────────────────────
  const dataParams = [...params, limit, offset];

  const result = await db.query(
    `SELECT
        e.id_exposicion,
        e.titulo,
        e.descripcion,
        e.fecha_exposicion,
        e.id_equipo,
        eq.nombre_equipo,
        e.id_rubrica,
        r.nombre_rubrica
     FROM exposiciones e
     JOIN equipos   eq ON eq.id_equipo  = e.id_equipo
     JOIN rubricas   r ON  r.id_rubrica = e.id_rubrica
     WHERE ${where}
     ORDER BY e.fecha_exposicion DESC
     LIMIT $${dataParams.length - 1}
     OFFSET $${dataParams.length}`,
    dataParams
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
        e.id_exposicion,
        e.titulo,
        e.descripcion,
        e.fecha_exposicion,
        e.id_equipo,
        eq.nombre_equipo,
        e.id_rubrica,
        r.nombre_rubrica,
        e.creado_en,
        e.actualizado_en
     FROM exposiciones e
     JOIN equipos  eq ON eq.id_equipo  = e.id_equipo
     JOIN rubricas  r ON  r.id_rubrica = e.id_rubrica
     WHERE e.id_exposicion = $1
       AND e.activo = true
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    const err = new Error(
      `La exposición con id ${id} no existe`
    );
    err.status = 404;
    throw err;
  }

  // Integrantes del equipo
  const integrantes = await db.query(
    `SELECT
        a.id_alumno,
        a.matricula,
        a.nombre,
        a.apellido_pat,
        ae.es_lider
     FROM alumnos_equipos ae
     JOIN alumnos a ON a.id_alumno = ae.id_alumno
     WHERE ae.id_equipo = $1`,
    [result.rows[0].id_equipo]
  );

  // Criterios de la rúbrica
  const criterios = await db.query(
    `SELECT
        id_criterio,
        nombre_criterio,
        descripcion,
        ponderacion
     FROM criterios
     WHERE id_rubrica = $1
       AND activo = true
     ORDER BY id_criterio ASC`,
    [result.rows[0].id_rubrica]
  );

  return {
    ...result.rows[0],
    integrantes: integrantes.rows,
    criterios: criterios.rows,
  };
}

// ─── CREAR ────────────────────────────────────────────────
async function crear({
  id_equipo,
  id_rubrica,
  titulo,
  fecha_exposicion,
  descripcion = null
}) {

  // 1. Equipo existe
  const equipo = await db.query(
    `SELECT id_equipo, id_grupo
     FROM equipos
     WHERE id_equipo = $1
       AND activo = true
     LIMIT 1`,
    [id_equipo]
  );

  if (equipo.rows.length === 0) {
    const err = new Error(
      `El equipo con id ${id_equipo} no existe`
    );
    err.status = 404;
    throw err;
  }

  // 2. Rúbrica existe
  const rubrica = await db.query(
    `SELECT id_rubrica
     FROM rubricas
     WHERE id_rubrica = $1
       AND activo = true
     LIMIT 1`,
    [id_rubrica]
  );

  if (rubrica.rows.length === 0) {
    const err = new Error(
      `La rúbrica con id ${id_rubrica} no existe`
    );
    err.status = 404;
    throw err;
  }

  // 3. Título duplicado para el mismo equipo
  const dup = await db.query(
    `SELECT id_exposicion
     FROM exposiciones
     WHERE id_equipo = $1
       AND titulo = $2
       AND activo = true
     LIMIT 1`,
    [id_equipo, titulo]
  );

  if (dup.rows.length > 0) {
    const err = new Error(
      `El equipo ya tiene una exposición con el título "${titulo}"`
    );
    err.status = 409;
    throw err;
  }

  // 4. INSERT
  const result = await db.query(
    `INSERT INTO exposiciones (
        id_equipo,
        id_rubrica,
        titulo,
        fecha_exposicion,
        descripcion
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_exposicion`,
    [
      id_equipo,
      id_rubrica,
      titulo,
      fecha_exposicion,
      descripcion
    ]
  );

  const id_exposicion = result.rows[0].id_exposicion;

  return obtenerPorId(id_exposicion);
}

// ─── ACTUALIZAR ───────────────────────────────────────────
async function actualizar(
  id,
  {
    id_equipo,
    id_rubrica,
    titulo,
    fecha_exposicion,
    descripcion = null
  }
) {

  await obtenerPorId(id);

  // 1. Equipo existe
  const equipo = await db.query(
    `SELECT id_equipo
     FROM equipos
     WHERE id_equipo = $1
       AND activo = true
     LIMIT 1`,
    [id_equipo]
  );

  if (equipo.rows.length === 0) {
    const err = new Error(
      `El equipo con id ${id_equipo} no existe`
    );
    err.status = 404;
    throw err;
  }

  // 2. Rúbrica existe
  const rubrica = await db.query(
    `SELECT id_rubrica
     FROM rubricas
     WHERE id_rubrica = $1
       AND activo = true
     LIMIT 1`,
    [id_rubrica]
  );

  if (rubrica.rows.length === 0) {
    const err = new Error(
      `La rúbrica con id ${id_rubrica} no existe`
    );
    err.status = 404;
    throw err;
  }

  // 3. Título duplicado (excluir el actual)
  const dup = await db.query(
    `SELECT id_exposicion
     FROM exposiciones
     WHERE id_equipo = $1
       AND titulo = $2
       AND id_exposicion != $3
       AND activo = true
     LIMIT 1`,
    [id_equipo, titulo, id]
  );

  if (dup.rows.length > 0) {
    const err = new Error(
      `El equipo ya tiene una exposición con el título "${titulo}"`
    );
    err.status = 409;
    throw err;
  }

  // 4. UPDATE
  await db.query(
    `UPDATE exposiciones
     SET
       id_equipo        = $1,
       id_rubrica       = $2,
       titulo           = $3,
       fecha_exposicion = $4,
       descripcion      = $5
     WHERE id_exposicion = $6`,
    [
      id_equipo,
      id_rubrica,
      titulo,
      fecha_exposicion,
      descripcion,
      id
    ]
  );

  return obtenerPorId(id);
}

// ─── ELIMINAR (SOFT DELETE) ───────────────────────────────
async function eliminar(id) {

  await obtenerPorId(id);

  await db.query(
    `UPDATE exposiciones
     SET activo = false
     WHERE id_exposicion = $1`,
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
