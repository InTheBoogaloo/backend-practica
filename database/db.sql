-- ============================================================
--  SISTEMA DE GESTIÓN DE EXPOSICIONES
--  Archivo: db.sql
--  Descripción: Modelo relacional completo derivado del
--               análisis del archivo openapi.yaml
-- ============================================================

-- ============================================================
-- SECCIÓN 1: CREACIÓN DE LA BASE DE DATOS
-- ============================================================

CREATE DATABASE IF NOT EXISTS sistema_exposiciones
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_exposiciones;

-- ============================================================
-- SECCIÓN 2: TABLAS PRINCIPALES
-- ============================================================

-- ------------------------------------------------------------
-- Tabla: materias
-- Descripción: Catálogo de materias académicas.
-- Derivada de: /materias, schema Materia y MateriaInput
-- ------------------------------------------------------------
CREATE TABLE materias (
    id_materia      INT            NOT NULL AUTO_INCREMENT,
    clave_materia   VARCHAR(20)    NOT NULL,
    nombre_materia  VARCHAR(150)   NOT NULL,
    activo          TINYINT(1)     NOT NULL DEFAULT 1,
    creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_materias          PRIMARY KEY (id_materia),
    CONSTRAINT uq_materias_clave    UNIQUE (clave_materia),
    CONSTRAINT uq_materias_nombre   UNIQUE (nombre_materia)
);

-- ------------------------------------------------------------
-- Tabla: grupos
-- Descripción: Grupos académicos asociados a una materia.
-- Derivada de: tag Grupos (recurso implícito en el API)
-- ------------------------------------------------------------
CREATE TABLE grupos (
    id_grupo        INT            NOT NULL AUTO_INCREMENT,
    id_materia      INT            NOT NULL,
    nombre_grupo    VARCHAR(50)    NOT NULL,   -- Ej: "6A", "Vespertino-2"
    semestre        VARCHAR(20)    NOT NULL,   -- Ej: "2025-1"
    activo          TINYINT(1)     NOT NULL DEFAULT 1,
    creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_grupos            PRIMARY KEY (id_grupo),
    CONSTRAINT fk_grupos_materia    FOREIGN KEY (id_materia)
        REFERENCES materias(id_materia) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_grupos_nombre_sem UNIQUE (id_materia, nombre_grupo, semestre)
);

-- ------------------------------------------------------------
-- Tabla: alumnos
-- Descripción: Datos de los alumnos registrados en el sistema.
-- Derivada de: tag Alumnos, id_alumno_evaluador en EvaluacionInput
-- ------------------------------------------------------------
CREATE TABLE alumnos (
    id_alumno       INT            NOT NULL AUTO_INCREMENT,
    matricula       VARCHAR(20)    NOT NULL,
    nombre          VARCHAR(100)   NOT NULL,
    apellido_pat    VARCHAR(80)    NOT NULL,
    apellido_mat    VARCHAR(80)    NULL,
    email           VARCHAR(150)   NOT NULL,
    activo          TINYINT(1)     NOT NULL DEFAULT 1,
    creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_alumnos           PRIMARY KEY (id_alumno),
    CONSTRAINT uq_alumnos_matricula UNIQUE (matricula),
    CONSTRAINT uq_alumnos_email     UNIQUE (email)
);

-- ------------------------------------------------------------
-- Tabla: alumnos_grupos  (relación M:N)
-- Descripción: Inscripción de un alumno a un grupo.
-- ------------------------------------------------------------
CREATE TABLE alumnos_grupos (
    id_alumno_grupo INT            NOT NULL AUTO_INCREMENT,
    id_alumno       INT            NOT NULL,
    id_grupo        INT            NOT NULL,
    fecha_inscripcion DATE         NOT NULL DEFAULT (CURDATE()),

    CONSTRAINT pk_alumnos_grupos    PRIMARY KEY (id_alumno_grupo),
    CONSTRAINT fk_ag_alumno         FOREIGN KEY (id_alumno)
        REFERENCES alumnos(id_alumno) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ag_grupo          FOREIGN KEY (id_grupo)
        REFERENCES grupos(id_grupo)  ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_ag_alumno_grupo   UNIQUE (id_alumno, id_grupo)
);

-- ------------------------------------------------------------
-- Tabla: equipos
-- Descripción: Equipos de trabajo dentro de un grupo.
-- Derivada de: tag Equipos
-- ------------------------------------------------------------
CREATE TABLE equipos (
    id_equipo       INT            NOT NULL AUTO_INCREMENT,
    id_grupo        INT            NOT NULL,
    nombre_equipo   VARCHAR(100)   NOT NULL,
    activo          TINYINT(1)     NOT NULL DEFAULT 1,
    creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_equipos           PRIMARY KEY (id_equipo),
    CONSTRAINT fk_equipos_grupo     FOREIGN KEY (id_grupo)
        REFERENCES grupos(id_grupo) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_equipo_nombre     UNIQUE (id_grupo, nombre_equipo)
);

-- ------------------------------------------------------------
-- Tabla: alumnos_equipos  (relación M:N)
-- Descripción: Miembros de un equipo.
-- Regla de negocio: Un alumno solo puede pertenecer a un
--                   equipo por grupo.
-- ------------------------------------------------------------
CREATE TABLE alumnos_equipos (
    id_alumno_equipo INT           NOT NULL AUTO_INCREMENT,
    id_alumno        INT           NOT NULL,
    id_equipo        INT           NOT NULL,
    es_lider         TINYINT(1)    NOT NULL DEFAULT 0,

    CONSTRAINT pk_alumnos_equipos   PRIMARY KEY (id_alumno_equipo),
    CONSTRAINT fk_ae_alumno         FOREIGN KEY (id_alumno)
        REFERENCES alumnos(id_alumno) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ae_equipo         FOREIGN KEY (id_equipo)
        REFERENCES equipos(id_equipo) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_ae_alumno_equipo  UNIQUE (id_alumno, id_equipo)
);

-- ------------------------------------------------------------
-- Tabla: rubricas
-- Descripción: Rúbricas de evaluación asociadas a una materia.
-- Derivada de: id_criterio en EvaluacionInput (requiere catálogo)
-- ------------------------------------------------------------
CREATE TABLE rubricas (
    id_rubrica      INT            NOT NULL AUTO_INCREMENT,
    id_materia      INT            NOT NULL,
    nombre_rubrica  VARCHAR(150)   NOT NULL,
    descripcion     TEXT           NULL,
    activo          TINYINT(1)     NOT NULL DEFAULT 1,
    creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_rubricas          PRIMARY KEY (id_rubrica),
    CONSTRAINT fk_rubricas_materia  FOREIGN KEY (id_materia)
        REFERENCES materias(id_materia) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- Tabla: criterios
-- Descripción: Criterios individuales de una rúbrica.
-- Derivada de: id_criterio en EvaluacionInput, calificacion 0-10
-- ------------------------------------------------------------
CREATE TABLE criterios (
    id_criterio     INT            NOT NULL AUTO_INCREMENT,
    id_rubrica      INT            NOT NULL,
    nombre_criterio VARCHAR(150)   NOT NULL,
    descripcion     TEXT           NULL,
    ponderacion     DECIMAL(5,2)   NOT NULL DEFAULT 1.00,
    activo          TINYINT(1)     NOT NULL DEFAULT 1,

    CONSTRAINT pk_criterios         PRIMARY KEY (id_criterio),
    CONSTRAINT fk_criterios_rubrica FOREIGN KEY (id_rubrica)
        REFERENCES rubricas(id_rubrica) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_ponderacion       CHECK (ponderacion > 0)
);

-- ------------------------------------------------------------
-- Tabla: exposiciones
-- Descripción: Exposiciones programadas para un equipo.
-- Derivada de: tag Exposiciones, id_exposicion en EvaluacionInput
-- ------------------------------------------------------------
CREATE TABLE exposiciones (
    id_exposicion   INT            NOT NULL AUTO_INCREMENT,
    id_equipo       INT            NOT NULL,
    id_rubrica      INT            NOT NULL,
    titulo          VARCHAR(200)   NOT NULL,
    fecha_exposicion DATETIME      NOT NULL,
    descripcion     TEXT           NULL,
    activo          TINYINT(1)     NOT NULL DEFAULT 1,
    creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_exposiciones      PRIMARY KEY (id_exposicion),
    CONSTRAINT fk_expo_equipo       FOREIGN KEY (id_equipo)
        REFERENCES equipos(id_equipo) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_expo_rubrica      FOREIGN KEY (id_rubrica)
        REFERENCES rubricas(id_rubrica) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- Tabla: evaluaciones
-- Descripción: Evaluación realizada por un alumno a una
--              exposición. Un alumno no puede evaluar dos
--              veces la misma exposición (409 Conflict en API).
-- Derivada de: POST /evaluaciones, schema EvaluacionInput
-- ------------------------------------------------------------
CREATE TABLE evaluaciones (
    id_evaluacion       INT        NOT NULL AUTO_INCREMENT,
    id_exposicion       INT        NOT NULL,
    id_alumno_evaluador INT        NOT NULL,
    calificacion_total  DECIMAL(5,2) NULL,   -- calculada por trigger
    creado_en           DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_evaluaciones      PRIMARY KEY (id_evaluacion),
    CONSTRAINT fk_eval_exposicion   FOREIGN KEY (id_exposicion)
        REFERENCES exposiciones(id_exposicion) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_eval_alumno       FOREIGN KEY (id_alumno_evaluador)
        REFERENCES alumnos(id_alumno) ON DELETE RESTRICT ON UPDATE CASCADE,
    -- Regla de negocio: evita evaluación duplicada (HTTP 409)
    CONSTRAINT uq_eval_unica        UNIQUE (id_exposicion, id_alumno_evaluador)
);

-- ------------------------------------------------------------
-- Tabla: evaluacion_detalles
-- Descripción: Calificación por criterio dentro de una
--              evaluación. Rango permitido: 0.00 – 10.00
-- Derivada de: array detalles en EvaluacionInput
-- ------------------------------------------------------------
CREATE TABLE evaluacion_detalles (
    id_detalle      INT            NOT NULL AUTO_INCREMENT,
    id_evaluacion   INT            NOT NULL,
    id_criterio     INT            NOT NULL,
    calificacion    DECIMAL(4,2)   NOT NULL,

    CONSTRAINT pk_evaluacion_det    PRIMARY KEY (id_detalle),
    CONSTRAINT fk_det_evaluacion    FOREIGN KEY (id_evaluacion)
        REFERENCES evaluaciones(id_evaluacion) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_det_criterio      FOREIGN KEY (id_criterio)
        REFERENCES criterios(id_criterio) ON DELETE RESTRICT ON UPDATE CASCADE,
    -- Regla de negocio: calificacion minimum:0 maximum:10 (del OpenAPI)
    CONSTRAINT ck_calificacion      CHECK (calificacion >= 0 AND calificacion <= 10),
    CONSTRAINT uq_det_crit_eval     UNIQUE (id_evaluacion, id_criterio)
);

-- ------------------------------------------------------------
-- Tabla: usuarios
-- Descripción: Credenciales de autenticación del sistema.
-- Derivada de: POST /auth/login, schema LoginRequest / LoginResponse
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario      INT            NOT NULL AUTO_INCREMENT,
    username        VARCHAR(60)    NOT NULL,
    password_hash   VARCHAR(255)   NOT NULL,
    rol             ENUM('ADMIN','DOCENTE','ALUMNO') NOT NULL DEFAULT 'ALUMNO',
    id_alumno       INT            NULL,   -- vinculado si rol = ALUMNO
    activo          TINYINT(1)     NOT NULL DEFAULT 1,
    creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuarios          PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuarios_username UNIQUE (username),
    CONSTRAINT fk_usuarios_alumno   FOREIGN KEY (id_alumno)
        REFERENCES alumnos(id_alumno) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- SECCIÓN 3: ÍNDICES ADICIONALES PARA RENDIMIENTO
-- ============================================================

CREATE INDEX idx_grupos_materia         ON grupos           (id_materia);
CREATE INDEX idx_alumnos_grupos_alumno  ON alumnos_grupos   (id_alumno);
CREATE INDEX idx_alumnos_grupos_grupo   ON alumnos_grupos   (id_grupo);
CREATE INDEX idx_alumnos_equipos_alumno ON alumnos_equipos  (id_alumno);
CREATE INDEX idx_alumnos_equipos_equipo ON alumnos_equipos  (id_equipo);
CREATE INDEX idx_exposiciones_equipo    ON exposiciones     (id_equipo);
CREATE INDEX idx_exposiciones_rubrica   ON exposiciones     (id_rubrica);
CREATE INDEX idx_evaluaciones_exposic   ON evaluaciones     (id_exposicion);
CREATE INDEX idx_evaluaciones_alumno    ON evaluaciones     (id_alumno_evaluador);
CREATE INDEX idx_evaluacion_det_eval    ON evaluacion_detalles (id_evaluacion);
CREATE INDEX idx_criterios_rubrica      ON criterios        (id_rubrica);

-- ============================================================
-- SECCIÓN 4: TRIGGER – CÁLCULO AUTOMÁTICO DE CALIFICACION TOTAL
-- Descripción: Recalcula calificacion_total en evaluaciones
--              cada vez que se inserta un detalle.
--              Pondera cada criterio según su campo ponderacion.
-- ============================================================

DELIMITER //

CREATE TRIGGER trg_recalcular_total
AFTER INSERT ON evaluacion_detalles
FOR EACH ROW
BEGIN
    DECLARE v_total DECIMAL(5,2);

    SELECT
        SUM(ed.calificacion * c.ponderacion) / NULLIF(SUM(c.ponderacion), 0)
    INTO v_total
    FROM evaluacion_detalles ed
    INNER JOIN criterios c ON c.id_criterio = ed.id_criterio
    WHERE ed.id_evaluacion = NEW.id_evaluacion;

    UPDATE evaluaciones
    SET calificacion_total = v_total,
        actualizado_en     = NOW()
    WHERE id_evaluacion = NEW.id_evaluacion;
END //

DELIMITER ;

-- ============================================================
-- SECCIÓN 5: DATOS SEMILLA (SEED)
-- ============================================================

-- Usuario administrador por defecto
INSERT INTO usuarios (username, password_hash, rol)
VALUES ('admin', '$2b$12$placeholder_hash_admin', 'ADMIN');

-- Materias de ejemplo (tomadas del schema del OpenAPI)
INSERT INTO materias (clave_materia, nombre_materia) VALUES
    ('PROG-01', 'Programación Web'),
    ('BD-02',   'Bases de Datos'),
    ('RS-03',   'Redes y Seguridad');

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
