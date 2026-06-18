-- ============================================================
-- WauPiura — Schema limpio para backend Java Spring Boot
-- Compatible con entidades JPA.
-- Ejecutar en MySQL para instalación limpia (ej. laptop nueva).
-- Incluye usuarios por defecto para desarrollo y pruebas.
-- ============================================================

CREATE DATABASE IF NOT EXISTS WauPiura
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE WauPiura;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS seguimientos;
DROP TABLE IF EXISTS solicitudes;
DROP TABLE IF EXISTS mascotas;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- USUARIOS — alineada con la entidad JPA Usuario
-- NOTA: cuando se implemente BCrypt, actualizar contraseñas a hashes.
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id             BIGINT        NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(100)  NOT NULL,
  email          VARCHAR(100)  NOT NULL,
  password       VARCHAR(255)  NOT NULL,
  telefono       VARCHAR(20)   NULL,
  rol            VARCHAR(20)   NOT NULL DEFAULT 'USUARIO',
  direccion      VARCHAR(255)  NULL,
  activo         BIT(1)        NOT NULL DEFAULT 1,
  fecha_registro DATETIME(6)   NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- MASCOTAS
-- ------------------------------------------------------------
CREATE TABLE mascotas (
  id                   BIGINT        NOT NULL AUTO_INCREMENT,
  nombre               VARCHAR(80)   NOT NULL,
  especie              VARCHAR(20)   NOT NULL,
  genero               VARCHAR(10)   NOT NULL,
  raza                 VARCHAR(100)  NULL,
  edad_meses           INT           NOT NULL DEFAULT 0,
  descripcion          TEXT          NULL,
  foto_url             VARCHAR(500)  NULL,
  disponible           BIT(1)        NOT NULL DEFAULT 1,
  estado               VARCHAR(20)   NOT NULL DEFAULT 'evaluacion',
  condicion            VARCHAR(150)  NULL,
  responsable          VARCHAR(100)  NULL,
  lugar_rescate        VARCHAR(150)  NULL,
  ultima_actualizacion DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  creado_en            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- SOLICITUDES DE ADOPCIÓN
-- ------------------------------------------------------------
CREATE TABLE solicitudes (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  mascota_id BIGINT      NOT NULL,
  usuario_id BIGINT      NOT NULL,
  mensaje    TEXT        NOT NULL,
  estado     VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  creado_en  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sol_mascota FOREIGN KEY (mascota_id) REFERENCES mascotas(id)  ON DELETE CASCADE,
  CONSTRAINT fk_sol_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- SEGUIMIENTOS CLÍNICOS
-- ------------------------------------------------------------
CREATE TABLE seguimientos (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  mascota_id  BIGINT       NOT NULL,
  titulo      VARCHAR(120) NOT NULL,
  descripcion TEXT         NOT NULL,
  estado      VARCHAR(20)  NOT NULL DEFAULT 'evaluacion',
  fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_seg_mascota FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- DATOS INICIALES
-- Contraseñas en texto plano (pendiente Tarea #1: BCrypt).
-- Cuando se implemente BCrypt, reemplazar password por el hash.
-- ------------------------------------------------------------
INSERT INTO usuarios (nombre, email, password, rol, activo, fecha_registro) VALUES
  ('Admin WauPiura', 'admin@waupiura.com', 'admin123', 'ADMIN',   1, NOW()),
  ('Diego Lopez',    'diego123@gmail.com', 'diego123', 'USUARIO', 1, NOW());

-- Mascotas de muestra
INSERT INTO mascotas (nombre, especie, genero, raza, edad_meses, descripcion, foto_url, disponible, estado, condicion, responsable, lugar_rescate) VALUES
('Luna',   'perro', 'hembra', 'Labrador Mix',      18, 'Luna es una perra muy cariñosa y activa.',            'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=280&fit=crop', 1, 'disponible',  'Saludable y apta para adopción',         'Equipo WauPiura',      'Piura Centro'),
('Max',    'perro', 'macho',  'Mestizo',            8,  'Max es un cachorro lleno de energía.',                'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=280&fit=crop', 1, 'evaluacion',  'En evaluación veterinaria inicial',       'Voluntarios WauPiura', 'Castilla'),
('Mimi',   'gato',  'hembra', 'Siamés Mix',         24, 'Mimi es tranquila y elegante.',                       'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400&h=280&fit=crop', 1, 'recuperacion','Recuperación leve',                      'Equipo veterinario',   'Veintiséis de Octubre'),
('Rocky',  'perro', 'macho',  'Beagle',             36, 'Rocky es leal y protector.',                          'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=280&fit=crop', 1, 'disponible',  'Saludable y sociable',                   'Equipo WauPiura',      'Urb. Santa María del Pinar'),
('Nala',   'gato',  'hembra', 'Angora Mix',         12, 'Nala es juguetona y curiosa.',                        'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=280&fit=crop', 1, 'tratamiento', 'Tratamiento dermatológico leve',          'Equipo veterinario',   'Piura Centro'),
('Buddy',  'perro', 'macho',  'Golden Retriever Mix', 6,'Buddy es el más tierno del refugio.',                 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&h=280&fit=crop', 1, 'evaluacion',  'Evaluación de vacunas pendiente',         'Voluntarios WauPiura', 'Los Ejidos'),
('Sasha',  'perro', 'hembra', 'Husky Mix',          30, 'Sasha es inteligente y enérgica.',                    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=280&fit=crop', 1, 'disponible',  'Saludable, requiere espacio amplio',     'Equipo WauPiura',      'Castilla'),
('Oliver', 'gato',  'macho',  'Doméstico',          48, 'Oliver ama las siestas al sol.',                      'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=400&h=280&fit=crop', 1, 'disponible',  'Saludable y esterilizado',               'Equipo WauPiura',      'Piura Centro');

INSERT INTO seguimientos (mascota_id, titulo, descripcion, estado) VALUES
(1, 'Evaluación completada', 'Luna fue evaluada y se encuentra apta para adopción.', 'disponible'),
(2, 'Ingreso al sistema',    'Max fue registrado como cachorro rescatado.',           'evaluacion'),
(3, 'Control de recuperación', 'Mimi presenta mejora progresiva.',                   'recuperacion'),
(4, 'Evaluación favorable',  'Rocky se encuentra en buen estado general.',           'disponible'),
(5, 'Inicio de tratamiento', 'Nala inició tratamiento dermatológico.',               'tratamiento'),
(6, 'Registro inicial',      'Buddy ingresó al refugio pendiente de vacunas.',       'evaluacion'),
(7, 'Mascota disponible',    'Sasha se encuentra lista para una familia activa.',    'disponible'),
(8, 'Evaluación finalizada', 'Oliver se encuentra esterilizado y apto.',             'disponible');
