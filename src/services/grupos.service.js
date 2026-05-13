const db = require('../config/db');

// ─── Listar ───────────────────────────────────────────────────
async function listar({ page = 0, size = 10, nombre = '' }) {

  const pageNum = Number(page) || 0;
  const sizeNum = Number(size) || 10;

  const offset = pageNum * sizeNum;
  const limit = sizeNum;

  const like = `%${nombre}%`;

  // TOTAL
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM grupos g
     WHERE g.activo = true
       AND g.nombre_grupo ILIKE $1`,
    [like]
  );

  const total = Number(totalResult.rows[0].total);

  // DATA
  const result = await db.query(
    `SELECT
        g.id_grupo,
        g.nombre_grupo,
        g.semestre,
        g.id_materia,
        m.nombre_materia
     FROM grupos g
     JOIN materias m
       ON m.id_materia = g.id_materia
     WHERE g.activo = true
       AND g.nombre_grupo ILIKE $1
     ORDER BY g.id_grupo ASC
     LIMIT $2 OFFSET $3`,
    [like, limit, offset]
  );

  return {
    page: pageNum,
    size: limit,
    totalElements: total,
    totalPages: Math.ceil(total / limit),
    content: result.rows,
  };
}

// ─── Obtener por ID (con alumnos inscritos) ───────────────────
async function obtenerPorId(id) {

  const result = await db.query(
    `SELECT
        g.id_grupo,
        g.nombre_grupo,
        g.semestre,
        g.id_materia,
        m.nombre_materia
     FROM grupos g
     JOIN materias m
       ON m.id_materia = g.id_materia
     WHERE g.id_grupo = $1
       AND g.activo = true
     LIMIT 1`,
    [id]
  );

  if (result.rows.length === 0) {
    const err = new Error(
      `El grupo con id ${id} no existe`
    );
    err.status = 404;
    throw err;
  }

  const alumnosResult = await db.query(
    `SELECT
        a.id_alumno,
        a.matricula,
        a.nombre,
        a.apellido_pat,
        a.email,
        ag.fecha_inscripcion
     FROM alumnos_grupos ag
     JOIN alumnos a
       ON a.id_alumno = ag.id_alumno
     WHERE ag.id_grupo = $1
       AND a.activo = true`,
    [id]
  );

  return {
    ...result.rows[0],
    alumnos: alumnosResult.rows
  };
}

// ─── Crear ────────────────────────────────────────────────────
async function crear({
  nombre_grupo,
  semestre,
  id_materia
}) {

  // validar materia
  const materia = await db.query(
    `SELECT id_materia
     FROM materias
     WHERE id_materia = $1
       AND activo = true
     LIMIT 1`,
    [id_materia]
  );

  if (materia.rows.length === 0) {
    const err = new Error(
      `La materia con id ${id_materia} no existe`
    );
    err.status = 404;
    throw err;
  }

  // validar duplicado
  const duplicado = await db.query(
    `SELECT id_grupo
     FROM grupos
     WHERE nombre_grupo = $1
       AND id_materia = $2
       AND semestre = $3
       AND activo = true
     LIMIT 1`,
    [
      nombre_grupo,
      id_materia,
      semestre
    ]
  );

  if (duplicado.rows.length > 0) {
    const err = new Error(
      `Ya existe el grupo "${nombre_grupo}" en esa materia y semestre`
    );
    err.status = 409;
    throw err;
  }

  // INSERT
  const result = await db.query(
    `INSERT INTO grupos (
        nombre_grupo,
        semestre,
        id_materia
     )
     VALUES ($1, $2, $3)
     RETURNING id_grupo`,
    [
      nombre_grupo,
      semestre,
      id_materia
    ]
  );

  const id_grupo = result.rows[0].id_grupo;

  return obtenerPorId(id_grupo);
}

// ─── Actualizar ───────────────────────────────────────────────
async function actualizar(
  id,
  {
    nombre_grupo,
    semestre,
    id_materia
  }
) {

  await obtenerPorId(id);

  // validar materia
  const materia = await db.query(
    `SELECT id_materia
     FROM materias
     WHERE id_materia = $1
       AND activo = true
     LIMIT 1`,
    [id_materia]
  );

  if (materia.rows.length === 0) {
    const err = new Error(
      `La materia con id ${id_materia} no existe`
    );
    err.status = 404;
    throw err;
  }

  // validar duplicado
  const duplicado = await db.query(
    `SELECT id_grupo
     FROM grupos
     WHERE nombre_grupo = $1
       AND id_materia = $2
       AND semestre = $3
       AND id_grupo != $4
       AND activo = true
     LIMIT 1`,
    [
      nombre_grupo,
      id_materia,
      semestre,
      id
    ]
  );

  if (duplicado.rows.length > 0) {
    const err = new Error(
      `Ya existe el grupo "${nombre_grupo}" en esa materia y semestre`
    );
    err.status = 409;
    throw err;
  }

  // UPDATE
  await db.query(
    `UPDATE grupos
     SET
       nombre_grupo = $1,
       semestre = $2,
       id_materia = $3
     WHERE id_grupo = $4`,
    [
      nombre_grupo,
      semestre,
      id_materia,
      id
    ]
  );

  return obtenerPorId(id);
}

// ─── Eliminar (soft delete) ───────────────────────────────────
async function eliminar(id) {

  await obtenerPorId(id);

  await db.query(
    `UPDATE grupos
     SET activo = false
     WHERE id_grupo = $1`,
    [id]
  );
}

// ─── Inscribir alumno ─────────────────────────────────────────
async function inscribirAlumno(
  id_grupo,
  id_alumno
) {

  await obtenerPorId(id_grupo);

  // validar alumno
  const alumno = await db.query(
    `SELECT id_alumno
     FROM alumnos
     WHERE id_alumno = $1
       AND activo = true
     LIMIT 1`,
    [id_alumno]
  );

  if (alumno.rows.length === 0) {
    const err = new Error(
      `El alumno con id ${id_alumno} no existe`
    );
    err.status = 404;
    throw err;
  }

  // validar inscripción
  const yaInscrito = await db.query(
    `SELECT id_alumno_grupo
     FROM alumnos_grupos
     WHERE id_grupo = $1
       AND id_alumno = $2
     LIMIT 1`,
    [id_grupo, id_alumno]
  );

  if (yaInscrito.rows.length > 0) {
    const err = new Error(
      `El alumno ${id_alumno} ya está inscrito en el grupo ${id_grupo}`
    );
    err.status = 409;
    throw err;
  }

  // INSERT
  await db.query(
    `INSERT INTO alumnos_grupos (
        id_alumno,
        id_grupo
     )
     VALUES ($1, $2)`,
    [id_alumno, id_grupo]
  );

  return obtenerPorId(id_grupo);
}

// ─── Quitar alumno ────────────────────────────────────────────
async function quitarAlumno(
  id_grupo,
  id_alumno
) {

  await obtenerPorId(id_grupo);

  const inscripcion = await db.query(
    `SELECT id_alumno_grupo
     FROM alumnos_grupos
     WHERE id_grupo = $1
       AND id_alumno = $2
     LIMIT 1`,
    [id_grupo, id_alumno]
  );

  if (inscripcion.rows.length === 0) {
    const err = new Error(
      `El alumno ${id_alumno} no está inscrito en el grupo ${id_grupo}`
    );
    err.status = 404;
    throw err;
  }

  // DELETE
  await db.query(
    `DELETE FROM alumnos_grupos
     WHERE id_grupo = $1
       AND id_alumno = $2`,
    [id_grupo, id_alumno]
  );
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  inscribirAlumno,
  quitarAlumno
};
