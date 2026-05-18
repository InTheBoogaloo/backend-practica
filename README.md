# exposiciones-backend

API REST para el Sistema de Gestión de Exposiciones.  
Stack: **Node.js · Express · MySQL2 · JWT · bcryptjs**

---

## Tabla de contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Puesta en marcha](#puesta-en-marcha)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Cómo agregar nuevos endpoints](#cómo-agregar-nuevos-endpoints)
5. [Referencia de la API](#referencia-de-la-api)
   - [Autenticación](#autenticación)
   - [Alumnos](#alumnos)
   - [Materias](#materias)
   - [Grupos](#grupos)
   - [Equipos](#equipos)
   - [Evaluaciones](#evaluaciones)
   - [Health Check](#health-check)
6. [Roles del sistema](#roles-del-sistema)
7. [Respuestas de error comunes](#respuestas-de-error-comunes)
8. [Notas de base de datos](#notas-de-base-de-datos)
9. [Estrategia de ramas y commits](#estrategia-de-ramas-y-commits)

---

## Requisitos previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://dev.mysql.com/downloads/) 8.0 o superior (o MariaDB 10.6+)
- [Git](https://git-scm.com/)
- [Thunder Client](https://www.thunderclient.com/) (extensión VS Code) o [Postman](https://www.postman.com/) para testear endpoints

Verifica tus versiones:

```bash
node -v
npm -v
mysql --version
```

---

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-org/exposiciones-backend.git
cd exposiciones-backend
```

### 2. Instalar dependencias

```bash
npm install
```

| Paquete | Propósito |
|---------|-----------|
| `express` | Framework del servidor |
| `mysql2` | Conexión a MySQL con soporte async/await |
| `jsonwebtoken` | Generar y verificar tokens JWT |
| `bcryptjs` | Hashear y comparar passwords |
| `dotenv` | Leer variables de entorno desde `.env` |
| `cors` | Permitir peticiones desde el frontend |
| `nodemon` | Reiniciar el servidor automáticamente en desarrollo |

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo con tus datos:

```bash
cp .env.example .env
```

```env
PORT=8080

DB_HOST=localhost
DB_PORT=3306
DB_NAME=exposiciones_db
DB_USER=root
DB_PASSWORD=tu_password_de_mysql

JWT_SECRET=pon_aqui_una_clave_larga_y_segura_de_al_menos_32_caracteres
JWT_EXPIRES_IN=3600
```

> **Importante:** Nunca subas el archivo `.env` al repositorio. Ya está incluido en `.gitignore`.

### 4. Configurar la base de datos

Ejecuta el archivo SQL desde la raíz del proyecto:

```bash
mysql -u root -p < exposiciones_db.sql
```

Ingresa tu password de MySQL cuando lo pida. Esto crea la base de datos `exposiciones_db` con todas las tablas y datos de prueba. Para verificar:

```bash
mysql -u root -p -e "USE exposiciones_db; SHOW TABLES;"
```

Debes ver:

```
+---------------------------+
| Tables_in_exposiciones_db |
+---------------------------+
| alumnos                   |
| criterios                 |
| equipo_integrantes        |
| equipos                   |
| evaluacion_detalles       |
| evaluaciones              |
| exposiciones              |
| grupo_alumnos             |
| grupos                    |
| materias                  |
| roles                     |
| rubricas                  |
| usuarios                  |
+---------------------------+
```

### 5. Generar passwords de prueba

El SQL inserta usuarios con hashes ficticios. Este script los reemplaza con hashes bcrypt reales. **Ejecútalo una sola vez**, justo después de cargar el SQL:

```bash
node src/utils/seed-passwords.js
```

Salida esperada:

```
Generando hashes y actualizando BD...

  admin01    →  hash generado
  docente01  →  hash generado
  docente02  →  hash generado
  alumno01   →  hash generado
  alumno02   →  hash generado
  alumno03   →  hash generado
  alumno04   →  hash generado
  alumno05   →  hash generado

Todos los passwords actualizados.
```

> Si lo ejecutas más de una vez no hay problema; simplemente regenera los hashes.

### 6. Arrancar el servidor

**Modo desarrollo** (se reinicia al guardar cambios):

```bash
npm run dev
```

**Modo producción:**

```bash
npm start
```

Salida esperada:

```
Servidor corriendo en http://localhost:8080/api/v1
```

### Usuarios de prueba

Todos usan el password `password123`.

| username | rol | acceso |
|----------|-----|--------|
| `admin01` | ADMIN | Todo, incluyendo DELETE |
| `docente01` | DOCENTE | POST y PUT en materias |
| `docente02` | DOCENTE | POST y PUT en materias |
| `alumno01` | ALUMNO | Registrar evaluaciones |
| `alumno02` | ALUMNO | Registrar evaluaciones |
| `alumno03` | ALUMNO | Registrar evaluaciones |

---

## Estructura del proyecto

```
exposiciones-backend/
├── .env.example                  ← Plantilla de variables de entorno
├── package.json
├── README.md
├── exposiciones_db.sql           ← Script SQL de la base de datos
└── src/
    ├── app.js                    ← Entry point; configura Express y rutas
    ├── config/
    │   └── db.js                 ← Pool de conexión a MySQL
    ├── controllers/
    │   └── auth.controller.js    ← Maneja request/response del login
    ├── middlewares/
    │   ├── auth.middleware.js    ← verifyToken + requireRol
    │   └── errorHandler.js       ← Manejo global de errores
    ├── routes/
    │   └── auth.routes.js        ← Define POST /auth/login
    ├── services/
    │   └── auth.service.js       ← Lógica: buscar usuario, bcrypt, JWT
    └── utils/
        └── seed-passwords.js     ← Script inicial de passwords
```

---

## Cómo agregar nuevos endpoints

Sigue el patrón de tres archivos. El ejemplo usa el recurso `materias`:

### 1. Servicio (`src/services/materias.service.js`)

Lógica de negocio y consultas a la base de datos.

```js
const db = require('../config/db');

async function listar({ page = 0, size = 10, nombre = '' }) {
  const offset = page * size;
  const like   = `%${nombre}%`;
  const [rows] = await db.query(
    'SELECT * FROM materias WHERE nombre_materia LIKE ? LIMIT ? OFFSET ?',
    [like, size, offset]
  );
  return rows;
}

module.exports = { listar };
```

### 2. Controlador (`src/controllers/materias.controller.js`)

Manejo de requests y responses HTTP.

```js
const materiasService = require('../services/materias.service');

async function listar(req, res, next) {
  try {
    const { page, size, nombre } = req.query;
    const datos = await materiasService.listar({ page, size, nombre });
    res.json(datos);
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
```

### 3. Rutas (`src/routes/materias.routes.js`)

```js
const { Router } = require('express');
const ctrl = require('../controllers/materias.controller');
const { requireRol } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/',       ctrl.listar);
router.post('/',      requireRol('ADMIN', 'DOCENTE'), ctrl.crear);
router.put('/:id',    requireRol('ADMIN', 'DOCENTE'), ctrl.actualizar);
router.delete('/:id', requireRol('ADMIN'),            ctrl.eliminar);

module.exports = router;
```

### 4. Registrar en `app.js`

Agrega estas líneas en `src/app.js` debajo de donde dice `TODO`:

```js
const materiasRoutes = require('./routes/materias.routes');
app.use(`${BASE}/materias`, materiasRoutes);
```

---

## Referencia de la API

Todos los endpoints (excepto `/auth/login` y `/health`) requieren JWT en el header:

```
Authorization: Bearer <token>
```

---

### Autenticación

#### `POST /api/v1/auth/login`

Autentica un usuario y devuelve un token JWT. No requiere autenticación previa.

**Body:**
```json
{
  "username": "a2024001",
  "password": "contraseña"
}
```

**Respuesta `200`:**
```json
{
  "token": "<jwt_token>",
  "tipo": "Bearer",
  "expira_en": 3600
}
```

**Errores:**
- `401` — Credenciales inválidas (usuario no existe o contraseña incorrecta)

> El `username` de los alumnos es su matrícula en minúsculas (ej. `a2024001`). El token incluye `sub` (id_usuario), `username` y `rol`.

Para probar con curl:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"docente01","password":"password123"}'
```

---

### Alumnos

Base: `/api/v1/alumnos`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | Cualquier usuario | Lista alumnos (paginado) |
| `GET` | `/:id` | Cualquier usuario | Obtiene alumno por ID |
| `POST` | `/` | `ADMIN`, `DOCENTE` | Crea alumno y usuario vinculado |
| `PUT` | `/:id` | `ADMIN`, `DOCENTE` | Actualiza datos del alumno |
| `DELETE` | `/:id` | `ADMIN` | Soft delete del alumno |

#### `GET /api/v1/alumnos`

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | `0` | Página (0-indexed) |
| `size` | number | `10` | Registros por página |
| `nombre` | string | `""` | Filtra por nombre, apellido o matrícula |

**Respuesta `200`:**
```json
{
  "page": 0,
  "size": 10,
  "totalElements": 42,
  "totalPages": 5,
  "content": [
    {
      "id_alumno": 1,
      "matricula": "A2024001",
      "nombre": "Juan",
      "apellido_pat": "Pérez",
      "apellido_mat": "García",
      "email": "juan@ejemplo.com"
    }
  ]
}
```

#### `GET /api/v1/alumnos/:id`

**Respuesta `200`:**
```json
{
  "id_alumno": 1,
  "matricula": "A2024001",
  "nombre": "Juan",
  "apellido_pat": "Pérez",
  "apellido_mat": "García",
  "email": "juan@ejemplo.com"
}
```
#### `GET /api/v1/alumnos`

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | `0` | Página (0-indexed) |
| `size` | number | `10` | Registros por página |
| `nombre` | string | `""` | Filtro por nombre, apellido o matrícula |
| `search` | string | `""` | Alias de `nombre` |

- **Errores:** `404` — Alumno no encontrado o inactivo

#### `POST /api/v1/alumnos`

Crea el alumno y su usuario del sistema en una transacción. El `username` se genera automáticamente como la matrícula en minúsculas.

**Body:**
```json
{
  "matricula": "A2024001",
  "nombre": "Juan",
  "apellido_pat": "Pérez",
  "apellido_mat": "García",
  "email": "juan@ejemplo.com",
  "password": "contraseña"
}
```

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `matricula` | Sí | Única en el sistema |
| `nombre` | Sí | |
| `apellido_pat` | Sí | |
| `apellido_mat` | No | |
| `email` | Sí | Único en el sistema |
| `password` | Sí | Se almacena con bcrypt |

**Respuesta `201`:** Objeto del alumno creado (misma forma que `GET /:id`).

- **Errores:** `409` — Matrícula, email o username ya existente

#### `PUT /api/v1/alumnos/:id`

**Body** — acepta `apellido_pat` o `apellido` como alias:
```json
{
  "nombre": "Juan",
  "apellido": "García",
  "email": "nuevo@ejemplo.com"
}
```

> La matrícula no se puede modificar.

**Respuesta `200`:** Alumno actualizado.

- **Errores:** `404` alumno no encontrado, `409` email duplicado

#### `DELETE /api/v1/alumnos/:id`

Soft delete: establece `activo = 0` en `alumnos` y en el registro de `usuarios` vinculado.

**Respuesta `200`:** Sin cuerpo.

- **Errores:** `404` — Alumno no encontrado

---

### Materias

Base: `/api/v1/materias`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | Cualquier usuario | Lista materias (paginado) |
| `GET` | `/:id` | Cualquier usuario | Obtiene materia por ID |
| `POST` | `/` | `ADMIN`, `DOCENTE` | Crea materia |
| `PUT` | `/:id` | `ADMIN`, `DOCENTE` | Actualiza materia |
| `DELETE` | `/:id` | `ADMIN` | Soft delete de materia |

#### `GET /api/v1/materias`

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | `0` | Página (0-indexed) |
| `size` | number | `10` | Registros por página |
| `nombre` | string | `""` | Filtra por nombre de materia |

**Respuesta `200`:**
```json
{
  "page": 0,
  "size": 10,
  "totalElements": 7,
  "totalPages": 1,
  "content": [
    {
      "id_materia": 1,
      "clave_materia": "MAT101",
      "nombre_materia": "Matemáticas Discretas"
    }
  ]
}
```

#### `GET /api/v1/materias/:id`

**Respuesta `200`:**
```json
{
  "id_materia": 1,
  "clave_materia": "MAT101",
  "nombre_materia": "Matemáticas Discretas"
}
```

- **Errores:** `404` — Materia no encontrada o inactiva

#### `POST /api/v1/materias`

**Body:**
```json
{
  "clave_materia": "MAT101",
  "nombre_materia": "Matemáticas Discretas"
}
```

**Respuesta `201`:** Materia creada.

- **Errores:** `409` — Clave o nombre ya existente

#### `PUT /api/v1/materias/:id`

**Body:**
```json
{
  "clave_materia": "MAT101",
  "nombre_materia": "Matemáticas Discretas"
}
```

**Respuesta `200`:** Materia actualizada.

- **Errores:** `404` no encontrada, `409` clave o nombre duplicado

#### `DELETE /api/v1/materias/:id`

Soft delete (`activo = 0`).

**Respuesta `200`:** Sin cuerpo.

- **Errores:** `404` — Materia no encontrada

---

### Grupos

Base: `/api/v1/grupos`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | Cualquier usuario | Lista grupos (paginado) |
| `GET` | `/:id` | Cualquier usuario | Obtiene grupo con alumnos inscritos |
| `POST` | `/` | ADMIN, DOCENTE | Crea grupo |
| `PUT` | `/:id` | ADMIN, DOCENTE | Actualiza grupo |
| `POST` | `/:id/alumnos` | ADMIN, DOCENTE | Inscribe alumno al grupo |
| `DELETE` | `/:id/alumnos/:id_alumno` | ADMIN, DOCENTE | Quita alumno del grupo |
| `DELETE` | `/:id` | ADMIN, DOCENTE | Soft delete del grupo |

#### `GET /api/v1/grupos`

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `page` | number | `0` | Página (0-indexed) |
| `size` | number | `10` | Registros por página |
| `nombre` | string | `""` | Filtra por nombre de grupo |

**Respuesta `200`:**
```json
{
  "page": 0,
  "size": 10,
  "totalElements": 3,
  "totalPages": 1,
  "content": [
    {
      "id_grupo": 1,
      "nombre_grupo": "Grupo A",
      "semestre": "2024-1",
      "id_materia": 1,
      "nombre_materia": "Matemáticas Discretas"
    }
  ]
}
```

#### `GET /api/v1/grupos/:id`

Incluye el listado de alumnos inscritos en el grupo.

**Respuesta `200`:**
```json
{
  "id_grupo": 1,
  "nombre_grupo": "Grupo A",
  "semestre": "2024-1",
  "id_materia": 1,
  "nombre_materia": "Matemáticas Discretas",
  "alumnos": [
    {
      "id_alumno": 1,
      "matricula": "A2024001",
      "nombre": "Juan",
      "apellido_pat": "Pérez",
      "email": "juan@ejemplo.com",
      "fecha_inscripcion": "2024-01-15"
    }
  ]
}
```

- **Errores:** `404` — Grupo no encontrado o inactivo

#### `POST /api/v1/grupos`

**Body:**
```json
{
  "nombre_grupo": "Grupo A",
  "semestre": "2024-1",
  "id_materia": 1
}
```

**Respuesta `201`:** Grupo creado (misma forma que `GET /:id`, con `alumnos: []`).

- **Errores:** `404` materia no encontrada, `409` grupo duplicado (mismo nombre + materia + semestre)

#### `PUT /api/v1/grupos/:id`

**Body:**
```json
{
  "nombre_grupo": "Grupo B",
  "semestre": "2024-2",
  "id_materia": 2
}
```

**Respuesta `200`:** Grupo actualizado.

- **Errores:** `404` grupo o materia no encontrados, `409` combinación duplicada

#### `POST /api/v1/grupos/:id/alumnos`

**Body:**
```json
{
  "id_alumno": 5
}
```

**Respuesta `200`:** Grupo completo con la lista de alumnos actualizada.

- **Errores:** `404` grupo o alumno no encontrado, `409` alumno ya inscrito

#### `DELETE /api/v1/grupos/:id/alumnos/:id_alumno`

**Respuesta `200`:** Sin cuerpo.

- **Errores:** `404` — Grupo no encontrado o alumno no inscrito en ese grupo

#### `DELETE /api/v1/grupos/:id`

Soft delete (`activo = 0`).

**Respuesta `200`:** Sin cuerpo.

- **Errores:** `404` — Grupo no encontrado

---

### Equipos

Base: `/api/v1/equipos`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | Cualquier usuario | Lista equipos existentes |
| `GET` | `/:id` | Cualquier usuario | Obtiene equipo por ID |
| `POST` | `/` | ADMIN, DOCENTE, ALUMNO | Crea equipo con integrantes |
| `PUT` | `/:id` | ADMIN, DOCENTE | Actualiza nombre e id_grupo |
| `DELETE` | `/:id` | ADMIN | Soft delete |

#### `GET /api/v1/equipos`

**Query params:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id_grupo` | integer | Filtra equipos por grupo |

#### `GET /api/v1/equipos/:id`

**Respuesta `200`:**
```json
{
  "id_equipo": 1,
  "nombre_equipo": "Equipo Alpha",
  "id_grupo": 1,
  "nombre_grupo": "6A",
  "integrantes": [
    { "id_alumno": 1, "matricula": "A2024001", "nombre": "Juan", "apellido_pat": "García", "es_lider": true },
    { "id_alumno": 2, "matricula": "A2024002", "nombre": "María", "apellido_pat": "López", "es_lider": false }
  ]
}
```

#### `POST /api/v1/equipos`

El alumno creador queda registrado automáticamente como líder del equipo y no es necesario incluirlo en `id_alumnos`.
El campo `id_alumno_creador` es opcional. Si no se envía, el equipo se crea sin integrantes iniciales.

**Body con creador:**
```json
{
  "id_grupo": 1,
  "nombre_equipo": "Equipo Alpha",
  "id_alumno_creador": 1,
  "id_alumnos": [2, 3]
}
```

**Body sin creador (ADMIN o DOCENTE):**
```json
{
  "id_grupo": 1,
  "nombre_equipo": "Equipo Beta"
}
```

#### `PUT /api/v1/equipos/:id`

**Body:**
```json
{
  "nombre_equipo": "Equipo Alpha Actualizado",
  "id_grupo": 1
}
```

**Respuesta `200`:** Equipo actualizado con integrantes.

- **Errores:** `404` equipo o grupo no encontrado, `409` nombre duplicado en el grupo

**Validaciones:**
- El grupo debe existir
- El nombre del equipo no puede repetirse dentro del mismo grupo
- El alumno creador debe existir
- Todos los alumnos en `id_alumnos` deben existir
- `nombre_equipo` debe tener entre 3 y 100 caracteres

---

### Evaluaciones

### Evaluaciones

Base: `/api/v1/evaluaciones`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | Cualquier usuario | Lista todas las evaluaciones |
| `POST` | `/` | ADMIN, DOCENTE, ALUMNO | Registra evaluación con rúbrica |

#### `GET /api/v1/evaluaciones`

**Respuesta `200`:**
```json
[
  {
    "id_evaluacion": 1,
    "id_exposicion": 1,
    "id_alumno_evaluador": 1,
    "calificacion_total": 8.50,
    "calificacion_final": 8.50,
    "creado_en": "2025-06-10T10:00:00.000Z"
  }
]
```

#### `POST /api/v1/evaluaciones`

La `calificacion_total` y `calificacion_final` las calcula automáticamente el trigger de la BD.

**Body:**
```json
{
  "id_exposicion": 1,
  "id_alumno_evaluador": 1,
  "detalles": [
    { "id_criterio": 1, "calificacion": 9.0 },
    { "id_criterio": 2, "calificacion": 8.5 },
    { "id_criterio": 3, "calificacion": 8.0 }
  ]
}
```

**Respuesta `201`:**
```json
{
  "id_evaluacion": 1,
  "id_exposicion": 1,
  "id_alumno_evaluador": 1,
  "calificacion_total": 8.50,
  "calificacion_final": 8.50,
  "creado_en": "2025-06-10T10:00:00.000Z",
  "detalles": [
    { "id_criterio": 1, "nombre_criterio": "Dominio del tema", "calificacion": 9.0 },
    { "id_criterio": 2, "nombre_criterio": "Claridad", "calificacion": 8.5 },
    { "id_criterio": 3, "nombre_criterio": "Material de apoyo", "calificacion": 8.0 }
  ]
}
```

**Errores:**
- `400` — Faltan criterios, criterios ajenos a la rúbrica o repetidos
- `404` — Exposición o alumno no encontrado
- `409` — El alumno ya evaluó esa exposición

---

### Exposiciones

Base: `/api/v1/exposiciones`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | Cualquier usuario | Lista exposiciones paginado |
| `GET` | `/:id` | Cualquier usuario | Obtiene exposición con criterios e integrantes |
| `POST` | `/` | ADMIN, DOCENTE | Crea exposición |
| `PUT` | `/:id` | ADMIN, DOCENTE | Actualiza exposición |
| `DELETE` | `/:id` | ADMIN | Soft delete |

#### `GET /api/v1/exposiciones`

**Query params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Página (default 0) |
| `size` | number | Tamaño (default 10) |
| `titulo` | string | Filtro por título |
| `id_equipo` | integer | Filtro por equipo |

#### `POST /api/v1/exposiciones`

**Body:**
```json
{
  "id_equipo": 1,
  "id_rubrica": 1,
  "titulo": "APIs REST con Node.js",
  "fecha_exposicion": "2025-06-10T10:00:00",
  "descripcion": "Exposición sobre desarrollo de APIs"
}
```

**Respuesta `201`:** Exposición creada con integrantes del equipo y criterios de la rúbrica.

- **Errores:** `404` equipo o rúbrica no encontrada, `409` título duplicado para el mismo equipo

---

### Criterios

Base: `/api/v1/criterios`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | Cualquier usuario | Lista criterios de una exposición |

#### `GET /api/v1/criterios`

Dado el ID de una exposición, retorna todos los criterios activos de su rúbrica.

**Query params:**

| Param | Requerido | Descripción |
|-------|-----------|-------------|
| `id_exposicion` | Sí | ID de la exposición |

**Ejemplo:** `GET /api/v1/criterios?id_exposicion=1`

**Respuesta `200`:**
```json
[
  { "id_criterio": 1, "nombre_criterio": "Dominio del tema", "descripcion": "Conocimiento al exponer", "ponderacion": "1.00" },
  { "id_criterio": 2, "nombre_criterio": "Claridad", "descripcion": "Organización y fluidez", "ponderacion": "1.00" },
  { "id_criterio": 3, "nombre_criterio": "Material de apoyo", "descripcion": "Calidad de diapositivas", "ponderacion": "1.00" }
]
```

- **Errores:** `400` falta id_exposicion, `404` exposición no encontrada

---

### Health Check

#### `GET /api/v1/health`

No requiere autenticación.

**Respuesta `200`:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-12T10:00:00.000Z"
}
```

---

## Roles del sistema

| Rol | Permisos |
|-----|----------|
| `ADMIN` | Acceso total: lectura, escritura y eliminación en todos los recursos |
| `DOCENTE` | Lectura y escritura en alumnos, materias y grupos; sin permiso de eliminar |
| `ALUMNO` | Solo puede registrar evaluaciones de exposiciones |

> Los usuarios con rol `ALUMNO` tienen un registro vinculado en la tabla `alumnos` via `id_alumno`. Su `username` es la matrícula en minúsculas.

---

## Respuestas de error comunes

| Código | Causa |
|--------|-------|
| `400` | Datos inválidos o incompletos |
| `401` | Token JWT ausente, expirado o inválido |
| `403` | El rol del usuario no tiene permiso para esta acción |
| `404` | Recurso no encontrado o inactivo |
| `409` | Conflicto — registro duplicado (matrícula, email, clave, etc.) |
| `500` | Error interno del servidor |

**Formato estándar de error:**
```json
{
  "timestamp": "2026-05-12T10:00:00.000Z",
  "status": 404,
  "error": "Not Found",
  "message": "Ruta GET /api/v1/inexistente no encontrada",
  "path": "/api/v1/inexistente"
}
```

---

## Notas de base de datos

- Todos los deletes son **soft delete** (`activo = 0`); los registros no se eliminan físicamente.
- La `calificacion_total` de las evaluaciones la recalcula automáticamente el trigger `trg_recalcular_total` como promedio ponderado de `evaluacion_detalles × criterios.ponderacion`.
- La combinación `(id_exposicion, id_alumno_evaluador)` es única: un alumno solo puede evaluar una exposición una vez.

---

## Estrategia de ramas y commits

### Estructura de ramas

```
main        ← solo código listo para producción; no se modifica directamente
develop     ← rama de integración; aquí se unen los features
feature/*   ← cada funcionalidad nueva
fix/*       ← correcciones de bugs
release/*   ← preparación de versiones
```

### Flujo de trabajo

```bash
# 1. Partir siempre desde develop actualizado
git checkout develop
git pull origin develop

# 2. Crear tu rama
git checkout -b feature/materias-crud

# 3. Trabajar y hacer commits
git add .
git commit -m "feat(materias): agregar listado paginado con filtro por nombre"

# 4. Subir tu rama
git push origin feature/materias-crud

# 5. Abrir Pull Request a develop en GitHub
# 6. Otro compañero revisa y aprueba
# 7. Merge a develop
```

### Convención de commits

```
feat(scope):      nueva funcionalidad
fix(scope):       corrección de bug
refactor(scope):  mejora sin cambiar comportamiento
docs(scope):      solo documentación
chore(scope):     dependencias, configs, CI
test(scope):      pruebas
```

Ejemplos del proyecto:

```
feat(auth): implementar login con JWT y bcrypt
feat(materias): agregar CRUD completo con paginación
fix(evaluaciones): corregir cálculo de promedio con 1 criterio
refactor(auth): extraer validación de token a middleware separado
docs(readme): agregar sección de variables de entorno
```

### Versionado semántico

Formato: `MAYOR.MENOR.PARCHE`

| Cuándo | Ejemplo |
|--------|---------|
| Cambio que rompe compatibilidad con el frontend | `v2.0.0` |
| Nueva funcionalidad sin romper nada | `v1.1.0` |
| Corrección de bug | `v1.0.1` |