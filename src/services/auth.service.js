const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

/**
 * Valida credenciales y devuelve un token JWT.
 * @param {string} username
 * @param {string} password  (texto plano)
 * @returns {{ token, tipo, expira_en }}
 * @throws Error con status 401 si las credenciales son incorrectas
 */
async function login(username, password) {
  // 1. Buscar usuario activo
  const [rows] = await db.query(
    `SELECT u.id_usuario, u.username, u.password, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.username = ? AND u.activo = 1
      LIMIT 1`,
    [username]
  );

  if (rows.length === 0) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const usuario = rows[0];

  // 2. Comparar password con hash bcrypt
  const coincide = await bcrypt.compare(password, usuario.password);
  if (!coincide) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  // 3. Generar JWT
  const expira_en = parseInt(process.env.JWT_EXPIRES_IN) || 3600;

  const payload = {
    sub:      usuario.id_usuario,
    username: usuario.username,
    rol:      usuario.rol,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expira_en,
  });

  return { token, tipo: 'Bearer', expira_en };
}

module.exports = { login };
