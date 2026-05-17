const db = require('../config/db');

// ─── REGISTRAR EVALUACIÓN ───────────────────────────────
async function registrar({
  id_exposicion,
  id_alumno_evaluador,
  detalles = []
}) {

  const client = await db.connect();

  try {

    // ── 1. Exposición ───────────────────────────────
    const expos = await client.query(
      `SELECT
          id_exposicion,
          id_rubrica
       FROM exposiciones
       WHERE id_exposicion = $1
         AND activo = true`,
      [id_exposicion]
    );

    if (expos.rows.length === 0) {
      const err = new Error(
        `La exposición con id ${id_exposicion} no existe`
      );
      err.status = 404;
      throw err;
    }

    const { id_rubrica } = expos.rows[0];

    // ── 2. Alumno ───────────────────────────────────
    const alumnos = await client.query(
      `SELECT id_alumno
       FROM alumnos
       WHERE id_alumno = $1
         AND activo = true`,
      [id_alumno_evaluador]
    );

    if (alumnos.rows.length === 0) {
      const err = new Error(
        `El alumno con id ${id_alumno_evaluador} no existe`
      );
      err.status = 404;
      throw err;
    }

    // ── 3. Evaluación duplicada ─────────────────────
    const dup = await client.query(
      `SELECT id_evaluacion
       FROM evaluaciones
       WHERE id_exposicion = $1
         AND id_alumno_evaluador = $2`,
      [id_exposicion, id_alumno_evaluador]
    );

    if (dup.rows.length > 0) {
      const err = new Error(
        `El alumno ${id_alumno_evaluador} ya evaluó esta exposición`
      );
      err.status = 409;
      throw err;
    }

    // ── 4. Criterios ────────────────────────────────
    const criterios = await client.query(
      `SELECT id_criterio
       FROM criterios
       WHERE id_rubrica = $1
         AND activo = true`,
      [id_rubrica]
    );

    if (criterios.rows.length === 0) {
      const err = new Error(
        'La rúbrica no tiene criterios'
      );
      err.status = 400;
      throw err;
    }

    // ── 5. Validación segura de detalles ────────────
    const safeDetalles = Array.isArray(detalles)
      ? detalles
      : [];

    const criterioIds = new Set(
      criterios.rows.map(c => c.id_criterio)
    );

    const detalleIds = safeDetalles.map(
      d => d.id_criterio
    );

    const detalleSet = new Set(detalleIds);

    const ajenos = detalleIds.filter(
      id => !criterioIds.has(id)
    );

    if (ajenos.length > 0) {
      const err = new Error(
        `Criterios inválidos: [${ajenos.join(', ')}]`
      );
      err.status = 400;
      throw err;
    }

    const faltantes = [...criterioIds].filter(
      id => !detalleSet.has(id)
    );

    if (faltantes.length > 0) {
      const err = new Error(
        `Faltan criterios: [${faltantes.join(', ')}]`
      );
      err.status = 400;
      throw err;
    }

    if (detalleIds.length !== detalleSet.size) {
      const err = new Error(
        'No se permiten criterios duplicados'
      );
      err.status = 400;
      throw err;
    }

    // ── 6. TRANSACCIÓN ──────────────────────────────
    await client.query('BEGIN');

    const evalResult = await client.query(
      `INSERT INTO evaluaciones (
          id_exposicion,
          id_alumno_evaluador
       )
       VALUES ($1, $2)
       RETURNING id_evaluacion`,
      [
        id_exposicion,
        id_alumno_evaluador
      ]
    );

    const id_evaluacion =
      evalResult.rows[0].id_evaluacion;

    // INSERT detalles
    for (const d of safeDetalles) {

      await client.query(
        `INSERT INTO evaluacion_detalles (
            id_evaluacion,
            id_criterio,
            calificacion
         )
         VALUES ($1, $2, $3)`,
        [
          id_evaluacion,
          d.id_criterio,
          d.calificacion
        ]
      );

    }

    await client.query('COMMIT');

    return obtenerPorId(id_evaluacion);

  } catch (err) {

    await client.query('ROLLBACK');
    throw err;

  } finally {

    client.release();

  }
}

// ─── OBTENER POR ID ─────────────────────────────────────
async function obtenerPorId(id_evaluacion) {

  const evals = await db.query(
  `SELECT id_evaluacion, id_exposicion, id_alumno_evaluador,
          calificacion_total, calificacion_total AS calificacion_final, creado_en
   FROM evaluaciones WHERE id_evaluacion = $1`,
  [id_evaluacion]
);

  if (evals.rows.length === 0) {
    const err = new Error(
      `La evaluación con id ${id_evaluacion} no existe`
    );
    err.status = 404;
    throw err;
  }

  const detalles = await db.query(
    `SELECT
        ed.id_criterio,
        c.nombre_criterio,
        ed.calificacion
     FROM evaluacion_detalles ed
     JOIN criterios c
       ON c.id_criterio = ed.id_criterio
     WHERE ed.id_evaluacion = $1`,
    [id_evaluacion]
  );

  return {
    ...evals.rows[0],
    detalles: detalles.rows
  };
}

async function listar() {
  const result = await db.query(
    `SELECT id_evaluacion, id_exposicion, id_alumno_evaluador,
            calificacion_total, calificacion_total AS calificacion_final, creado_en
     FROM evaluaciones
     ORDER BY id_evaluacion DESC`
  );
  return result.rows;
}

module.exports = {
  registrar,
  obtenerPorId,
  listar
};
