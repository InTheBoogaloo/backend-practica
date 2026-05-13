require('dotenv').config();
const express    = require('express');
const cors       = require('cors');

const authRoutes         = require('./routes/auth.routes');
const materiasRoutes     = require('./routes/materias.routes');
const alumnosRoutes      = require('./routes/alumnos.routes');
const gruposRoutes       = require('./routes/grupos.routes');
const evaluacionesRoutes = require('./routes/evaluaciones.routes');
const equiposRoutes      = require('./routes/equipos.routes');
const exposicionesRoutes = require('./routes/exposiciones.routes');

const errorHandler    = require('./middlewares/errorHandler');
const { verifyToken } = require('./middlewares/auth.middleware');

const app  = express();
const PORT = process.env.PORT || 8080;
const BASE = '/api/v1';


// ─── Middlewares globales ─────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Rutas públicas (sin JWT) ─────────────────────────────────
app.use(`${BASE}/auth`, authRoutes);

// ─── JWT requerido a partir de aquí ──────────────────────────
app.use(verifyToken);

app.use(`${BASE}/materias`,     materiasRoutes);
app.use(`${BASE}/alumnos`,      alumnosRoutes);
app.use(`${BASE}/grupos`,       gruposRoutes);
app.use(`${BASE}/evaluaciones`, evaluacionesRoutes);
app.use(`${BASE}/equipos`,      equiposRoutes);
app.use(`${BASE}/exposiciones`, exposicionesRoutes);

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
