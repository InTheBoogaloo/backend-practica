/**
 * Ejecutar UNA sola vez para generar los hashes bcrypt
 * de los usuarios de prueba e insertarlos en la BD.
 *
 * Uso:
 *   node src/utils/seed-passwords.js
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

const usuarios = [
  { username: 'admin', password: 'password123' },
];

async function seed() {
  console.log('Generando hashes y actualizando BD...\n');

  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, 10);
    const [result] = await db.query(
      'UPDATE usuarios SET password_hash = ? WHERE username = ?',
      [hash, u.username]
    );

    if (result.affectedRows === 0) {
      console.log(`⚠️   ${u.username}  →  no encontrado en la BD`);
    } else {
      console.log(`✅  ${u.username}  →  hash generado`);
    }
  }

  console.log('\n✔  Listo.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error en seed:', err.message);
  process.exit(1);
});
