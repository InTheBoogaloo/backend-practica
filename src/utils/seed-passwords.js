/**
 * Seeder de usuarios de prueba — PostgreSQL / Supabase
 *
 * Genera hashes bcrypt e inserta/actualiza usuarios en la BD.
 * Uso:
 *   node src/utils/seed-passwords.js
 *
 * Variables de entorno requeridas (en .env):
 *   DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db
 *   (o las variables individuales PG_HOST, PG_USER, PG_PASSWORD, PG_DATABASE, PG_PORT)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

const usuarios = [
  { username: 'admin', password: 'password123', rol: 'ADMIN' },
];

async function seed() {
  console.log('Generando hashes y actualizando BD...\n');

  const client = await pool.connect();
  try {
    for (const u of usuarios) {
      const hash = await bcrypt.hash(u.password, 10);

      // Intenta actualizar primero; si no existe, inserta
      const updateResult = await client.query(
        'UPDATE usuarios SET password_hash = $1 WHERE username = $2',
        [hash, u.username]
      );

      if (updateResult.rowCount === 0) {
        // No existía — lo crea
        await client.query(
          `INSERT INTO usuarios (username, password_hash, rol)
           VALUES ($1, $2, $3::rol_usuario)`,
          [u.username, hash, u.rol]
        );
        console.log(`✅  ${u.username}  →  creado con hash`);
      } else {
        console.log(`✅  ${u.username}  →  hash actualizado`);
      }
    }
    console.log('\n✔  Listo.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Error en seed:', err.message);
  process.exit(1);
});
