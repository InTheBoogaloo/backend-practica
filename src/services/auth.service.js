const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function login(username, password) {
  const result = await db.query(
    `SELECT id_usuario, username, password_hash, rol
     FROM usuarios
     WHERE username = $1 AND activo = true
     LIMIT 1`,
    [username]
  );

  const usuario = result.rows[0];

  if (!usuario) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);

  if (!coincide) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const expira_en = parseInt(process.env.JWT_EXPIRES_IN) || 3600;

  const token = jwt.sign(
    {
      sub: usuario.id_usuario,
      username: usuario.username,
      rol: usuario.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: expira_en }
  );

  return {
    token,
    tipo: 'Bearer',
    expira_en
  };
}

module.exports = { login };
