CREATE DATABASE IF NOT EXISTS exposiciones_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE exposiciones_db;


CREATE TABLE roles (
  id_rol      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
  id_usuario  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,     
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  id_rol      INT UNSIGNED NOT NULL,
  activo      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);


CREATE TABLE materias (
  id_materia      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clave_materia   VARCHAR(20)  NOT NULL UNIQUE,
  nombre_materia  VARCHAR(100) NOT NULL UNIQUE
);


CREATE TABLE grupos (
  id_grupo    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50)  NOT NULL,
  id_materia  INT UNSIGNED NOT NULL,
  id_docente  INT UNSIGNED NOT NULL,
  CONSTRAINT fk_grupo_materia FOREIGN KEY (id_materia) REFERENCES materias(id_materia),
  CONSTRAINT fk_grupo_docente FOREIGN KEY (id_docente) REFERENCES usuarios(id_usuario)
);


CREATE TABLE alumnos (
  id_alumno   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT UNSIGNED NOT NULL UNIQUE,
  matricula   VARCHAR(20)  NOT NULL UNIQUE,
  CONSTRAINT fk_alumno_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE grupo_alumnos (
  id_grupo    INT UNSIGNED NOT NULL,
  id_alumno   INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_grupo, id_alumno),
  CONSTRAINT fk_ga_grupo  FOREIGN KEY (id_grupo)  REFERENCES grupos(id_grupo),
  CONSTRAINT fk_ga_alumno FOREIGN KEY (id_alumno) REFERENCES alumnos(id_alumno)
);

CREATE TABLE equipos (
  id_equipo   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  id_grupo    INT UNSIGNED NOT NULL,
  CONSTRAINT fk_equipo_grupo FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo)
);

CREATE TABLE equipo_integrantes (
  id_equipo   INT UNSIGNED NOT NULL,
  id_alumno   INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_equipo, id_alumno),
  CONSTRAINT fk_ei_equipo FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo),
  CONSTRAINT fk_ei_alumno FOREIGN KEY (id_alumno) REFERENCES alumnos(id_alumno)
);

CREATE TABLE rubricas (
  id_rubrica  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT
);

CREATE TABLE criterios (
  id_criterio INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_rubrica  INT UNSIGNED NOT NULL,
  nombre      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  orden       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_criterio_rubrica FOREIGN KEY (id_rubrica) REFERENCES rubricas(id_rubrica)
);

CREATE TABLE exposiciones (
  id_exposicion   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_equipo       INT UNSIGNED NOT NULL,
  id_rubrica      INT UNSIGNED NOT NULL,
  tema            VARCHAR(200) NOT NULL,
  fecha_hora      DATETIME     NOT NULL,
  CONSTRAINT fk_expo_equipo   FOREIGN KEY (id_equipo)  REFERENCES equipos(id_equipo),
  CONSTRAINT fk_expo_rubrica  FOREIGN KEY (id_rubrica) REFERENCES rubricas(id_rubrica)
);

CREATE TABLE evaluaciones (
  id_evaluacion       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_exposicion       INT UNSIGNED NOT NULL,
  id_alumno_evaluador INT UNSIGNED NOT NULL,
  calificacion_final  DECIMAL(4,2) NOT NULL,   -- promedio calculado
  fecha_registro      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_eval_expo_alumno (id_exposicion, id_alumno_evaluador),
  CONSTRAINT fk_eval_exposicion FOREIGN KEY (id_exposicion)       REFERENCES exposiciones(id_exposicion),
  CONSTRAINT fk_eval_alumno     FOREIGN KEY (id_alumno_evaluador) REFERENCES alumnos(id_alumno)
);

CREATE TABLE evaluacion_detalles (
  id_detalle      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_evaluacion   INT UNSIGNED NOT NULL,
  id_criterio     INT UNSIGNED NOT NULL,
  calificacion    DECIMAL(4,2) NOT NULL,   -- entre 0.00 y 10.00
  CONSTRAINT chk_calificacion CHECK (calificacion >= 0 AND calificacion <= 10),
  CONSTRAINT fk_det_evaluacion FOREIGN KEY (id_evaluacion) REFERENCES evaluaciones(id_evaluacion),
  CONSTRAINT fk_det_criterio   FOREIGN KEY (id_criterio)   REFERENCES criterios(id_criterio)
);
--data samples
INSERT INTO roles (nombre) VALUES
  ('ADMIN'),
  ('DOCENTE'),
  ('ALUMNO');

INSERT INTO usuarios (username, password, nombre, email, id_rol) VALUES
  ('admin01',    '$2b$10$Kix4fM1C1jFakeHashAdminxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'Administrador Sistema',  'admin@sistema.edu',    1),
  ('docente01',  '$2b$10$Kix4fM1C1jFakeHashDocentexxxxxxxxxxxxxxxxxxxxxxxxxx01', 'Prof. Laura Martínez',   'laura@sistema.edu',    2),
  ('docente02',  '$2b$10$Kix4fM1C1jFakeHashDocentexxxxxxxxxxxxxxxxxxxxxxxxxx02', 'Prof. Carlos Ramos',     'carlos@sistema.edu',   2),
  ('alumno01',   '$2b$10$Kix4fM1C1jFakeHashAlumnoxxxxxxxxxxxxxxxxxxxxxxxxxx01',  'Ana González',           'ana@sistema.edu',      3),
  ('alumno02',   '$2b$10$Kix4fM1C1jFakeHashAlumnoxxxxxxxxxxxxxxxxxxxxxxxxxx02',  'Luis Hernández',         'luis@sistema.edu',     3),
  ('alumno03',   '$2b$10$Kix4fM1C1jFakeHashAlumnoxxxxxxxxxxxxxxxxxxxxxxxxxx03',  'María López',            'maria@sistema.edu',    3),
  ('alumno04',   '$2b$10$Kix4fM1C1jFakeHashAlumnoxxxxxxxxxxxxxxxxxxxxxxxxxx04',  'Pedro Sánchez',          'pedro@sistema.edu',    3),
  ('alumno05',   '$2b$10$Kix4fM1C1jFakeHashAlumnoxxxxxxxxxxxxxxxxxxxxxxxxxx05',  'Sofía Díaz',             'sofia@sistema.edu',    3);

INSERT INTO alumnos (id_usuario, matricula) VALUES
  (4, 'A2021001'),
  (5, 'A2021002'),
  (6, 'A2021003'),
  (7, 'A2021004'),
  (8, 'A2021005');

INSERT INTO materias (clave_materia, nombre_materia) VALUES
  ('PROG-01',  'Programación Web'),
  ('BD-01',    'Base de Datos'),
  ('REDES-01', 'Redes de Computadoras');


INSERT INTO grupos (nombre, id_materia, id_docente) VALUES
  ('Grupo A — Prog. Web',        1, 2),
  ('Grupo B — Base de Datos',    2, 3),
  ('Grupo C — Redes',            3, 2);


INSERT INTO grupo_alumnos (id_grupo, id_alumno) VALUES
  (1, 1), (1, 2), (1, 3),
  (2, 3), (2, 4), (2, 5),
  (3, 1), (3, 4);


INSERT INTO equipos (nombre, id_grupo) VALUES
  ('Equipo Alpha', 1),
  ('Equipo Beta',  1),
  ('Equipo Gamma', 2);


INSERT INTO equipo_integrantes (id_equipo, id_alumno) VALUES
  (1, 1), (1, 2),
  (2, 3),
  (3, 4), (3, 5);


INSERT INTO rubricas (nombre, descripcion) VALUES
  ('Rúbrica General de Exposición', 'Evalúa dominio, claridad y material de apoyo'),
  ('Rúbrica Técnica',               'Evalúa profundidad técnica y metodología');


INSERT INTO criterios (id_rubrica, nombre, descripcion, orden) VALUES
  (1, 'Dominio del tema',         'Conocimiento y seguridad al exponer', 1),
  (1, 'Claridad en la exposición','Organización y fluidez del discurso',  2),
  (1, 'Material de apoyo',        'Calidad de diapositivas o recursos',   3),
  (2, 'Profundidad técnica',      'Nivel de detalle y precisión',          1),
  (2, 'Metodología',              'Orden y estructura de la investigación',2);


INSERT INTO exposiciones (id_equipo, id_rubrica, tema, fecha_hora) VALUES
  (1, 1, 'Desarrollo de APIs REST con Node.js',    '2025-06-10 10:00:00'),
  (2, 1, 'Frameworks CSS modernos: Tailwind vs Bootstrap', '2025-06-10 11:00:00'),
  (3, 2, 'Normalización de bases de datos',        '2025-06-12 09:00:00');


INSERT INTO evaluaciones (id_exposicion, id_alumno_evaluador, calificacion_final) VALUES
  (1, 5, 8.67);

INSERT INTO evaluacion_detalles (id_evaluacion, id_criterio, calificacion) VALUES
  (1, 1, 9.0),
  (1, 2, 8.5),
  (1, 3, 8.5);

