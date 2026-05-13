const db = require('../config/db');

// ─── Listar ───────────────────────────────────────────────────
async function listar({ page = 0, size = 10, nombre = '' }) {
  const offset = parseInt(page) * parseInt(size);
  const limit  = parseInt(size);
  const like   = `%${nombre}%`;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM grupos g
      WHERE g.activo = 1 AND g.nombre_grupo LIKE ?`,
    [like]
  );

  const [rows] = await db.query(
    `SELECT g.id_grupo, g.nombre_grupo, g.semestre,
            g.id_materia, m.nombre_materia
       FROM grupos g
       JOIN materias m ON m.id_materia = g.id_materia
      WHERE g.activo = 1 AND g.nombre_grupo LIKE ?
      ORDER BY g.id_grupo ASC
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

// ─── Obtener por ID (con alumnos inscritos) ───────────────────
async function obtenerPorId(id) {
  const [rows] = await db.query(
    `SELECT g.id_grupo, g.nombre_grupo, g.semestre,
            g.id_materia, m.nombre_materia
       FROM grupos g
       JOIN materias m ON m.id_materia = g.id_materia
      WHERE g.id_grupo = ? AND g.activo = 1 LIMIT 1`,
    [id]
  );

  if (rows.length === 0) {
    const err = new Error(`El grupo con id ${id} no existe`);
    err.status = 404;
    throw err;
  }

  const [alumnos] = await db.query(
    `SELECT a.id_alumno, a.matricula, a.nombre, a.apellido_pat, a.email,
            ag.fecha_inscripcion
       FROM alumnos_grupos ag
       JOIN alumnos a ON a.id_alumno = ag.id_alumno
      WHERE ag.id_grupo = ? AND a.activo = 1`,
    [id]
  );

  return { ...rows[0], alumnos };
}

// ─── Crear ────────────────────────────────────────────────────
async function crear({ nombre_grupo, semestre, id_materia }) {
  const [materia] = await db.query(
    'SELECT id_materia FROM materias WHERE id_materia = ? AND activo = 1 LIMIT 1',
    [id_materia]
  );
  if (materia.length === 0) {
    const err = new Error(`La materia con id ${id_materia} no existe`);
    err.status = 404;
    throw err;
  }

  const [duplicado] = await db.query(
    'SELECT id_grupo FROM grupos WHERE nombre_grupo = ? AND id_materia = ? AND semestre = ? AND activo = 1 LIMIT 1',
    [nombre_grupo, id_materia, semestre]
  );
  if (duplicado.length > 0) {
    const err = new Error(`Ya existe el grupo "${nombre_grupo}" en esa materia y semestre`);
    err.status = 409;
    throw err;
  }

  const [result] = await db.query(
    'INSERT INTO grupos (nombre_grupo, semestre, id_materia) VALUES (?,?,?)',
    [nombre_grupo, semestre, id_materia]
  );

  return obtenerPorId(result.insertId);
}

// ─── Actualizar ───────────────────────────────────────────────
async function actualizar(id, { nombre_grupo, semestre, id_materia }) {
  await obtenerPorId(id);

  const [materia] = await db.query(
    'SELECT id_materia FROM materias WHERE id_materia = ? AND activo = 1 LIMIT 1',
    [id_materia]
  );
  if (materia.length === 0) {
    const err = new Error(`La materia con id ${id_materia} no existe`);
    err.status = 404;
    throw err;
  }

  const [duplicado] = await db.query(
    'SELECT id_grupo FROM grupos WHERE nombre_grupo = ? AND id_materia = ? AND semestre = ? AND id_grupo != ? AND activo = 1 LIMIT 1',
    [nombre_grupo, id_materia, semestre, id]
  );
  if (duplicado.length > 0) {
    const err = new Error(`Ya existe el grupo "${nombre_grupo}" en esa materia y semestre`);
    err.status = 409;
    throw err;
  }

  await db.query(
    'UPDATE grupos SET nombre_grupo = ?, semestre = ?, id_materia = ? WHERE id_grupo = ?',
    [nombre_grupo, semestre, id_materia, id]
  );

  return obtenerPorId(id);
}

// ─── Eliminar (soft delete) ───────────────────────────────────
async function eliminar(id) {
  await obtenerPorId(id);
  await db.query('UPDATE grupos SET activo = 0 WHERE id_grupo = ?', [id]);
}

// ─── Inscribir alumno ─────────────────────────────────────────
async function inscribirAlumno(id_grupo, id_alumno) {
  await obtenerPorId(id_grupo);

  const [alumno] = await db.query(
    'SELECT id_alumno FROM alumnos WHERE id_alumno = ? AND activo = 1 LIMIT 1',
    [id_alumno]
  );
  if (alumno.length === 0) {
    const err = new Error(`El alumno con id ${id_alumno} no existe`);
    err.status = 404;
    throw err;
  }

  const [yaInscrito] = await db.query(
    'SELECT id_alumno_grupo FROM alumnos_grupos WHERE id_grupo = ? AND id_alumno = ? LIMIT 1',
    [id_grupo, id_alumno]
  );
  if (yaInscrito.length > 0) {
    const err = new Error(`El alumno ${id_alumno} ya está inscrito en el grupo ${id_grupo}`);
    err.status = 409;
    throw err;
  }

  await db.query(
    'INSERT INTO alumnos_grupos (id_alumno, id_grupo) VALUES (?,?)',
    [id_alumno, id_grupo]
  );

  return obtenerPorId(id_grupo);
}

// ─── Quitar alumno ────────────────────────────────────────────
async function quitarAlumno(id_grupo, id_alumno) {
  await obtenerPorId(id_grupo);

  const [inscripcion] = await db.query(
    'SELECT id_alumno_grupo FROM alumnos_grupos WHERE id_grupo = ? AND id_alumno = ? LIMIT 1',
    [id_grupo, id_alumno]
  );
  if (inscripcion.length === 0) {
    const err = new Error(`El alumno ${id_alumno} no está inscrito en el grupo ${id_grupo}`);
    err.status = 404;
    throw err;
  }

  await db.query(
    'DELETE FROM alumnos_grupos WHERE id_grupo = ? AND id_alumno = ?',
    [id_grupo, id_alumno]
  );
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar, inscribirAlumno, quitarAlumno };
