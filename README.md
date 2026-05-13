# exposiciones-backend

API REST para el Sistema de Gestión de Exposiciones.  
Stack: **Node.js · Express · MySQL2 · JWT · bcryptjs**

---

## Tabla de contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Clonar el repositorio](#clonar-el-repositorio)
3. [Instalar dependencias](#instalar-dependencias)
4. [Configurar variables de entorno](#configurar-variables-de-entorno)
5. [Configurar la base de datos](#configurar-la-base-de-datos)
6. [Generar passwords de prueba](#generar-passwords-de-prueba)
7. [Arrancar el servidor](#arrancar-el-servidor)
8. [Probar el login](#probar-el-login)
9. [Usuarios de prueba](#usuarios-de-prueba)
10. [Estructura del proyecto](#estructura-del-proyecto)
11. [Cómo agregar nuevos endpoints](#cómo-agregar-nuevos-endpoints)
12. [Estrategia de ramas y commits](#estrategia-de-ramas-y-commits)

---

## Requisitos previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://dev.mysql.com/downloads/) 8.0 o superior (o MariaDB 10.6+)
- [Git](https://git-scm.com/)
- [Thunder Client](https://www.thunderclient.com/) (extensión VS Code) o [Postman](https://www.postman.com/) para testear

Verifica tus versiones:

```bash
node -v
npm -v
mysql --version
```

---

## Clonar el repositorio

```bash
git clone https://github.com/tu-org/exposiciones-backend.git
cd exposiciones-backend
```

---

## Instalar dependencias

```bash
npm install
```

Esto instala:

| Paquete | Para qué sirve |
|---|---|
| `express` | Framework del servidor |
| `mysql2` | Conexión a MySQL con soporte async/await |
| `jsonwebtoken` | Generar y verificar tokens JWT |
| `bcryptjs` | Hashear y comparar passwords |
| `dotenv` | Leer variables de entorno desde `.env` |
| `cors` | Permitir peticiones desde el frontend |
| `nodemon` | Reiniciar el servidor automáticamente en desarrollo |

---

## Configurar variables de entorno

Copia el archivo de ejemplo y edítalo con tus datos:

```bash
cp .env.example .env
```

Abre `.env` y rellena los valores:

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

> ⚠️ **Importante:** Nunca subas el archivo `.env` al repositorio. Ya está incluido en `.gitignore`.

---

## Configurar la base de datos

### 1. Crear la base de datos

Ejecuta el archivo SQL desde la raíz del proyecto:

```bash
mysql -u root -p < exposiciones_db.sql
```

Ingresa tu password de MySQL cuando lo pida. Esto crea la base de datos `exposiciones_db` con todas las tablas y datos de prueba.

### 2. Verificar que se creó correctamente

```bash
mysql -u root -p -e "USE exposiciones_db; SHOW TABLES;"
```

Debes ver algo como:

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

---

## Generar passwords de prueba

El SQL inserta usuarios con hashes ficticios. Este script los reemplaza con hashes bcrypt reales.  
**Ejecútalo una sola vez**, justo después de cargar el SQL:

```bash
node src/utils/seed-passwords.js
```

Salida esperada:

```
Generando hashes y actualizando BD...

✅  admin01    →  hash generado
✅  docente01  →  hash generado
✅  docente02  →  hash generado
✅  alumno01   →  hash generado
✅  alumno02   →  hash generado
✅  alumno03   →  hash generado
✅  alumno04   →  hash generado
✅  alumno05   →  hash generado

✔  Todos los passwords actualizados.
```

> Si lo ejecutas más de una vez no hay problema, simplemente regenera los hashes.

---

## Arrancar el servidor

**Modo desarrollo** (se reinicia solo al guardar cambios):

```bash
npm run dev
```

**Modo producción:**

```bash
npm start
```

Salida esperada:

```
🚀  Servidor corriendo en http://localhost:8080/api/v1
```

---

## Probar el login

### Con Thunder Client o Postman

Crea una petición con estos datos:

| Campo | Valor |
|---|---|
| Método | `POST` |
| URL | `http://localhost:8080/api/v1/auth/login` |
| Header | `Content-Type: application/json` |

Body (JSON):

```json
{
  "username": "docente01",
  "password": "password123"
}
```

**Respuesta exitosa (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tipo": "Bearer",
  "expira_en": 3600
}
```

**Respuesta con credenciales incorrectas (401):**

```json
{
  "timestamp": "2025-06-10T14:30:00.000Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Credenciales inválidas",
  "path": "/api/v1/auth/login"
}
```

### Con curl (terminal)

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"docente01","password":"password123"}'
```

### Probar una ruta protegida con el token

Copia el token de la respuesta anterior y úsalo en el header `Authorization`:

```bash
curl http://localhost:8080/api/v1/health \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Respuesta esperada (200):**

```json
{
  "status": "ok",
  "timestamp": "2025-06-10T14:30:00.000Z"
}
```

Sin token (o con token inválido) recibirás un `401`.

---

## Usuarios de prueba

Todos usan el password `password123`.

| username | rol | acceso |
|---|---|---|
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
    ├── app.js                    ← Entry point, configura Express y rutas
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

Sigue siempre este patrón de 3 archivos. Se muestra el ejemplo con materias:

### 1. Servicio (`src/services/materias.service.js`)

Aquí va la lógica de negocio y las consultas a la base de datos.

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

Aquí se manejan los requests y responses HTTP.

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
## Registro de Evaluaciones

Endpoint disponible bajo `/api/v1/evaluaciones`. Requiere JWT.

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| POST | `/evaluaciones` | ALUMNO | Registrar evaluación con rúbrica |

### Body requerido (POST /evaluaciones)

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

> La `calificacion_total` no se envía, la calcula automáticamente un trigger en la base de datos.

### Validaciones aplicadas

- La exposición debe existir
- El alumno evaluador debe existir
- No se permiten evaluaciones duplicadas (mismo evaluador + exposición)
- Los criterios enviados deben pertenecer a la rúbrica de la exposición
- Se debe enviar exactamente un detalle por cada criterio de la rúbrica
- Cada calificación debe estar entre 0 y 10

### Archivos involucrados

src/
├── services/evaluaciones.service.js       ← lógica y consultas a BD
├── controllers/evaluaciones.controller.js ← manejo de request/response
└── routes/evaluaciones.routes.js          ← definición de rutas y permisos

---

## Equipos

Endpoints disponibles bajo `/api/v1/equipos`. Requieren JWT.

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/equipos` | Cualquiera | Listar equipos existentes |
| POST | `/equipos` | ALUMNO | Crear equipo con integrantes |

### Body requerido (POST /equipos)

```json
{
  "id_grupo": 1,
  "nombre_equipo": "Equipo Alpha",
  "id_alumno_creador": 1,
  "id_alumnos": [2, 3]
}
```

> El alumno creador queda registrado automáticamente como líder del equipo.
> No es necesario incluir al creador en `id_alumnos`, se agrega solo.

### Parámetros de filtro (GET /equipos)

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id_grupo` | integer | Filtrar equipos por grupo |

### Validaciones aplicadas

- El grupo debe existir
- El nombre del equipo no puede repetirse dentro del mismo grupo
- El alumno creador debe existir
- Todos los alumnos en `id_alumnos` deben existir
- `nombre_equipo` debe tener entre 3 y 100 caracteres

### Archivos involucrados
src/
├── services/equipos.service.js       ← lógica y consultas a BD
├── controllers/equipos.controller.js ← manejo de request/response
└── routes/equipos.routes.js          ← definición de rutas y permisos

---

## Estrategia de ramas y commits

### Ramas

```
main        ← solo código listo para producción, no se toca directo
develop     ← rama de integración, aquí se unen los features
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
feat(scope):     nueva funcionalidad
fix(scope):      corrección de bug
refactor(scope): mejora sin cambiar comportamiento
docs(scope):     solo documentación
chore(scope):    dependencias, configs, CI
test(scope):     pruebas
```

Ejemplos reales del proyecto:

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
|---|---|
| Cambio que rompe compatibilidad con el frontend | `v2.0.0` |
| Nueva funcionalidad sin romper nada | `v1.1.0` |
| Corrección de bug | `v1.0.1` |
