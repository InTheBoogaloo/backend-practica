require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');
const { verifyToken } = require('./middlewares/auth.middleware');

const app  = express();
const PORT = process.env.PORT || 8080;

// ─── Middlewares globales ─────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Rutas ───────────────────────────────────────────────────
const BASE = '/api/v1';

// Auth — sin JWT
app.use(`${BASE}/auth`, authRoutes);

// A partir de aquí TODOS los endpoints requieren JWT
app.use(verifyToken);

const materiasRoutes = require('./routes/materias.routes');
app.use(`${BASE}/materias`, materiasRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get(`${BASE}/health`, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    timestamp: new Date().toISOString(),
    status:    404,
    error:     'Not Found',
    message:   `Ruta ${req.method} ${req.originalUrl} no encontrada`,
    path:      req.originalUrl,
  });
});

// ─── Error handler global ─────────────────────────────────────
app.use(errorHandler);

// ─── Arrancar servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Servidor corriendo en http://localhost:${PORT}${BASE}`);
});
