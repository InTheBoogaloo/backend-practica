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
  { username: 'admin01',   password: 'password123' },
  { username: 'docente01', password: 'password123' },
  { username: 'docente02', password: 'password123' },
  { username: 'alumno01',  password: 'password123' },
  { username: 'alumno02',  password: 'password123' },
  { username: 'alumno03',  password: 'password123' },
  { username: 'alumno04',  password: 'password123' },
  { username: 'alumno05',  password: 'password123' },
];

async function seed() {
  console.log('Generando hashes y actualizando BD...\n');

  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.query(
      'UPDATE usuarios SET password = ? WHERE username = ?',
      [hash, u.username]
    );
    console.log(`✅  ${u.username}  →  hash generado`);
  }

  console.log('\n✔  Todos los passwords actualizados.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error en seed:', err.message);
  process.exit(1);
});
