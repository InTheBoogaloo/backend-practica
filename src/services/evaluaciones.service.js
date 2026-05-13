const db = require('../config/db');

// ─── REGISTRAR EVALUACIÓN ───────────────────────────────
async function registrar({
  id_exposicion,
  id_alumno_evaluador,
  detalles = []
}) {
  const conn = await db.getConnection();

  try {
    // ── 1. Exposición ───────────────────────────────
    const [expos] = await conn.query(
      `SELECT id_exposicion, id_rubrica
       FROM exposiciones
       WHERE id_exposicion = ? AND activo = 1`,
      [id_exposicion]
    );

    if (expos.length === 0) {
      const err = new Error(`La exposición con id ${id_exposicion} no existe`);
      err.status = 404;
      throw err;
    }

    const { id_rubrica } = expos[0];

    // ── 2. Alumno ───────────────────────────────────
    const [alumnos] = await conn.query(
      'SELECT id_alumno FROM alumnos WHERE id_alumno = ? AND activo = 1',
      [id_alumno_evaluador]
    );

    if (alumnos.length === 0) {
      const err = new Error(`El alumno con id ${id_alumno_evaluador} no existe`);
      err.status = 404;
      throw err;
    }

    // ── 3. Evaluación duplicada ─────────────────────
    const [dup] = await conn.query(
      `SELECT id_evaluacion
       FROM evaluaciones
       WHERE id_exposicion = ? AND id_alumno_evaluador = ?`,
      [id_exposicion, id_alumno_evaluador]
    );

    if (dup.length > 0) {
      const err = new Error(
        `El alumno ${id_alumno_evaluador} ya evaluó esta exposición`
      );
      err.status = 409;
      throw err;
    }

    // ── 4. Criterios ────────────────────────────────
    const [criterios] = await conn.query(
      `SELECT id_criterio
       FROM criterios
       WHERE id_rubrica = ? AND activo = 1`,
      [id_rubrica]
    );

    if (criterios.length === 0) {
      const err = new Error('La rúbrica no tiene criterios');
      err.status = 400;
      throw err;
    }

    // ── 5. Validación segura de detalles ────────────
    const safeDetalles = Array.isArray(detalles) ? detalles : [];

    const criterioIds = new Set(criterios.map(c => c.id_criterio));
    const detalleIds = safeDetalles.map(d => d.id_criterio);
    const detalleSet = new Set(detalleIds);

    const ajenos = detalleIds.filter(id => !criterioIds.has(id));
    if (ajenos.length > 0) {
      const err = new Error(
        `Criterios inválidos: [${ajenos.join(', ')}]`
      );
      err.status = 400;
      throw err;
    }

    const faltantes = [...criterioIds].filter(id => !detalleSet.has(id));
    if (faltantes.length > 0) {
      const err = new Error(
        `Faltan criterios: [${faltantes.join(', ')}]`
      );
      err.status = 400;
      throw err;
    }

    if (detalleIds.length !== detalleSet.size) {
      const err = new Error('No se permiten criterios duplicados');
      err.status = 400;
      throw err;
    }

    // ── 6. TRANSACCIÓN ──────────────────────────────
    await conn.beginTransaction();

    const [evalResult] = await conn.query(
      `INSERT INTO evaluaciones (id_exposicion, id_alumno_evaluador)
       VALUES (?, ?)`,
      [id_exposicion, id_alumno_evaluador]
    );

    const id_evaluacion = evalResult.insertId;

    // INSERT MASIVO (MEJOR QUE LOOP)
    const values = safeDetalles.map(d => [
      id_evaluacion,
      d.id_criterio,
      d.calificacion
    ]);

    await conn.query(
      `INSERT INTO evaluacion_detalles
       (id_evaluacion, id_criterio, calificacion)
       VALUES ?`,
      [values]
    );

    await conn.commit();

    return obtenerPorId(id_evaluacion);

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─── OBTENER POR ID ─────────────────────────────────────
async function obtenerPorId(id_evaluacion) {
  const [evals] = await db.query(
    `SELECT id_evaluacion, id_exposicion, id_alumno_evaluador,
            calificacion_total, creado_en
     FROM evaluaciones
     WHERE id_evaluacion = ?`,
    [id_evaluacion]
  );

  if (evals.length === 0) {
    const err = new Error(`La evaluación con id ${id_evaluacion} no existe`);
    err.status = 404;
    throw err;
  }

  const [detalles] = await db.query(
    `SELECT ed.id_criterio, c.nombre_criterio, ed.calificacion
     FROM evaluacion_detalles ed
     JOIN criterios c ON c.id_criterio = ed.id_criterio
     WHERE ed.id_evaluacion = ?`,
    [id_evaluacion]
  );

  return { ...evals[0], detalles };
}

module.exports = { registrar, obtenerPorId };
