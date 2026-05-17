const db = require('../config/db');

async function listarPorExposicion(id_exposicion) {
  // Verificar que la exposición existe
  const expo = await db.query(
    `SELECT id_rubrica FROM exposiciones WHERE id_exposicion = $1 AND activo = true`,
    [id_exposicion]
  );
  if (expo.rows.length === 0) {
    const err = new Error(`La exposición con id ${id_exposicion} no existe`);
    err.status = 404; throw err;
  }

  const { id_rubrica } = expo.rows[0];

  const result = await db.query(
    `SELECT id_criterio, nombre_criterio, descripcion, ponderacion
     FROM criterios
     WHERE id_rubrica = $1 AND activo = true
     ORDER BY id_criterio ASC`,
    [id_rubrica]
  );

  return result.rows;
}

module.exports = { listarPorExposicion };