# exposiciones-backend

API REST — Sistema de Gestión de Exposiciones  
Stack: **Node.js · Express · MySQL2 · JWT · bcryptjs**

---

## Estructura

```
src/
├── app.js                    ← Entry point
├── config/
│   └── db.js                 ← Pool de conexión MySQL
├── controllers/
│   └── auth.controller.js
├── middlewares/
│   ├── auth.middleware.js    ← verifyToken + requireRol
│   └── errorHandler.js
├── routes/
│   └── auth.routes.js
├── services/
│   └── auth.service.js       ← Lógica de negocio login
└── utils/
    └── seed-passwords.js     ← Script inicial de passwords
```

---

## Instalación

```bash
npm install
```

---

## Configuración

```bash
cp .env.example .env
# Editar .env con tus datos de BD y JWT_SECRET
```

---

## Primer arranque

### 1. Crear la base de datos

Ejecutar el archivo `exposiciones_db.sql` en MySQL:

```bash
mysql -u root -p < exposiciones_db.sql
```

### 2. Generar hashes de passwords

Los INSERT del SQL usan hashes ficticios. Ejecutar este script **una sola vez**:

```bash
node src/utils/seed-passwords.js
```

### 3. Arrancar el servidor

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start
```

Servidor disponible en: `http://localhost:8080/api/v1`

---

## Endpoint de login

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "docente01",
  "password": "password123"
}
```

**Respuesta 200:**
```json
{
  "token": "eyJhbGci...",
  "tipo": "Bearer",
  "expira_en": 3600
}
```

**Usar el token en rutas protegidas:**
```
Authorization: Bearer eyJhbGci...
```

---

## Usuarios de prueba

| username   | password    | rol     |
|------------|-------------|---------|
| admin01    | password123 | ADMIN   |
| docente01  | password123 | DOCENTE |
| docente02  | password123 | DOCENTE |
| alumno01   | password123 | ALUMNO  |
| alumno02   | password123 | ALUMNO  |

---

## Agregar nuevas rutas (ejemplo: materias)

```js
// src/routes/materias.routes.js  → crear archivo
// src/app.js  → descomentar:
const materiasRoutes = require('./routes/materias.routes');
app.use(`${BASE}/materias`, materiasRoutes);
```

---

## Estrategia de ramas

```
main        ← producción estable
develop     ← integración
feature/*   ← nueva funcionalidad
fix/*       ← correcciones
release/*   ← versiones
```

**Convención de commits:**
```
feat(auth): implementar login con JWT
fix(materias): corregir paginación cuando no hay registros
```
