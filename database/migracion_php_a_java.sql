-- ============================================================
-- Migración: alinear la tabla `usuarios` (esquema viejo PHP)
-- con la entidad JPA `Usuario` del backend Java (Spring Boot).
-- Migra los datos existentes y elimina las columnas heredadas de PHP.
-- ============================================================
USE WauPiura;

-- 0. Backup de seguridad de la tabla usuarios
DROP TABLE IF EXISTS usuarios_backup;
CREATE TABLE usuarios_backup AS SELECT * FROM usuarios;

-- 1. Quitar la FK que impide cambiar el tipo de usuarios.id
ALTER TABLE solicitudes DROP FOREIGN KEY solicitudes_ibfk_2;

-- 2. Migrar datos de las columnas PHP -> columnas Java
UPDATE usuarios SET email    = correo      WHERE email IS NULL OR email = '';
UPDATE usuarios SET password = contrasena  WHERE password IS NULL OR password = '';

-- 3. rol en MAYÚSCULAS (la entidad usa enum STRING: ADMIN/USUARIO/VOLUNTARIO)
ALTER TABLE usuarios MODIFY COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'USUARIO';
UPDATE usuarios SET rol = UPPER(rol);

-- 4. fecha_registro (no se pudo crear antes por valores 0000-00-00)
ALTER TABLE usuarios ADD COLUMN fecha_registro DATETIME(6) NULL;
UPDATE usuarios SET fecha_registro = COALESCE(creado_en, NOW()) WHERE fecha_registro IS NULL;
ALTER TABLE usuarios MODIFY COLUMN fecha_registro DATETIME(6) NOT NULL;

-- 5. activo = true para los usuarios existentes (se creó con default 0)
UPDATE usuarios SET activo = 1;

-- 6. Alinear tipos de id (entidad usa Long -> BIGINT) y la FK de solicitudes
ALTER TABLE usuarios   MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE solicitudes MODIFY COLUMN usuario_id BIGINT NOT NULL;
ALTER TABLE solicitudes
  ADD CONSTRAINT fk_solicitudes_usuario
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- 7. Eliminar las columnas heredadas de PHP
ALTER TABLE usuarios DROP COLUMN correo;
ALTER TABLE usuarios DROP COLUMN contrasena;
ALTER TABLE usuarios DROP COLUMN creado_en;

-- 8. Verificación
SELECT id, nombre, email, password, rol, telefono, direccion, activo, fecha_registro
FROM usuarios;
