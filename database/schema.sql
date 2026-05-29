CREATE DATABASE IF NOT EXISTS waupiura
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE waupiura;

DROP TABLE IF EXISTS seguimientos;
DROP TABLE IF EXISTS solicitudes;
DROP TABLE IF EXISTS mascotas;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('admin','usuario') DEFAULT 'usuario',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mascotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  especie ENUM('perro','gato','otro') NOT NULL,
  genero ENUM('macho','hembra') NOT NULL,
  raza VARCHAR(100),
  edad_meses INT NOT NULL DEFAULT 0,
  descripcion TEXT,
  foto_url VARCHAR(500),
  disponible TINYINT(1) DEFAULT 1,

  estado ENUM('evaluacion','tratamiento','recuperacion','disponible') DEFAULT 'evaluacion',
  condicion VARCHAR(150),
  responsable VARCHAR(100),
  lugar_rescate VARCHAR(150),
  ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solicitudes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  usuario_id INT NOT NULL,
  mensaje TEXT NOT NULL,
  estado ENUM('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE seguimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descripcion TEXT NOT NULL,
  estado ENUM('evaluacion','tratamiento','recuperacion','disponible') DEFAULT 'evaluacion',
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE
);

INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES
('Admin WauPiura', 'admin@waupiura.com', 'admin123', 'admin');

INSERT INTO mascotas 
(nombre, especie, genero, raza, edad_meses, descripcion, foto_url, disponible, estado, condicion, responsable, lugar_rescate)
VALUES
('Luna', 'perro', 'hembra', 'Labrador Mix', 18, 'Luna es una perra muy cariñosa y activa. Le encanta jugar con pelotas y hacer amigos.', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=280&fit=crop', 1, 'disponible', 'Saludable y apta para adopción', 'Equipo WauPiura', 'Piura Centro'),

('Max', 'perro', 'macho', 'Mestizo', 8, 'Max es un cachorro lleno de energía. Aprende rápido y adora la compañía humana.', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=280&fit=crop', 1, 'evaluacion', 'En evaluación veterinaria inicial', 'Voluntarios WauPiura', 'Castilla'),

('Mimi', 'gato', 'hembra', 'Siamés Mix', 24, 'Mimi es tranquila y elegante. Ideal para departamentos o hogares tranquilos.', 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400&h=280&fit=crop', 1, 'recuperacion', 'Recuperación leve', 'Equipo veterinario', 'Veintiséis de Octubre'),

('Rocky', 'perro', 'macho', 'Beagle', 36, 'Rocky es leal y protector. Se lleva muy bien con otros perros.', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=280&fit=crop', 1, 'disponible', 'Saludable y sociable', 'Equipo WauPiura', 'Urb. Santa María del Pinar'),

('Nala', 'gato', 'hembra', 'Angora Mix', 12, 'Nala es juguetona y curiosa. Muy cariñosa con su familia una vez que confía.', 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&h=280&fit=crop', 1, 'tratamiento', 'Tratamiento dermatológico leve', 'Equipo veterinario', 'Piura Centro'),

('Buddy', 'perro', 'macho', 'Golden Retriever Mix', 6, 'Buddy es el más tierno del refugio. Necesita una familia con mucho amor.', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&h=280&fit=crop', 1, 'evaluacion', 'Evaluación de vacunas pendiente', 'Voluntarios WauPiura', 'Los Ejidos'),

('Sasha', 'perro', 'hembra', 'Husky Mix', 30, 'Sasha es inteligente y enérgica. Perfecta para personas activas.', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=280&fit=crop', 1, 'disponible', 'Saludable, requiere espacio amplio', 'Equipo WauPiura', 'Castilla'),

('Oliver', 'gato', 'macho', 'Doméstico', 48, 'Oliver ama las siestas al sol y las caricias. El compañero perfecto.', 'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=400&h=280&fit=crop', 1, 'disponible', 'Saludable y esterilizado', 'Equipo WauPiura', 'Piura Centro'),

('Coco', 'perro', 'hembra', 'Chihuahua Mix', 15, 'Coco es pequeña pero muy valiente. Ideal para departamentos.', 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=400&h=280&fit=crop', 1, 'recuperacion', 'Recuperación de desnutrición leve', 'Equipo veterinario', 'Veintiséis de Octubre'),

('Thor', 'perro', 'macho', 'Rottweiler Mix', 20, 'Thor es noble y leal. Requiere un dueño con experiencia en perros grandes.', 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400&h=280&fit=crop', 1, 'tratamiento', 'Tratamiento preventivo y control de conducta', 'Equipo veterinario', 'Castilla'),

('Kira', 'gato', 'hembra', 'Persa Mix', 9, 'Kira es esponjosa y adorable. Muy fácil de cuidar.', 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=280&fit=crop', 1, 'evaluacion', 'Evaluación general pendiente', 'Voluntarios WauPiura', 'Urb. Miraflores'),

('Simba', 'perro', 'macho', 'Pastor Mix', 42, 'Simba es protector y fiel. Listo para un hogar estable.', 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=400&h=280&fit=crop', 1, 'disponible', 'Saludable, ideal para casa con patio', 'Equipo WauPiura', 'Los Ejidos');

INSERT INTO seguimientos (mascota_id, titulo, descripcion, estado) VALUES
(1, 'Evaluación completada', 'Luna fue evaluada por el equipo veterinario y se encuentra apta para iniciar un proceso de adopción.', 'disponible'),
(1, 'Lista para adopción', 'Luna mantiene buen comportamiento y buena respuesta con personas and otros animales.', 'disponible'),

(2, 'Ingreso al sistema', 'Max fue registrado como cachorro rescatado y se encuentra en evaluación inicial.', 'evaluacion'),
(2, 'Evaluación veterinaria pendiente', 'Se programó revisión para validar vacunas, peso y estado general.', 'evaluacion'),

(3, 'Control de recuperación', 'Mimi presenta mejora progresiva y requiere seguimiento semanal.', 'recuperacion'),
(3, 'Observación de conducta', 'Mimi se muestra tranquila y adaptable a espacios cerrados.', 'recuperacion'),

(4, 'Evaluación favorable', 'Rocky fue evaluado y se encuentra en buen estado general.', 'disponible'),

(5, 'Inicio de tratamiento', 'Nala inició tratamiento dermatológico leve y debe continuar en observación.', 'tratamiento'),

(6, 'Registro inicial', 'Buddy ingresó al refugio y se encuentra pendiente de validación de vacunas.', 'evaluacion'),

(7, 'Mascota disponible', 'Sasha se encuentra saludable y lista para una familia activa.', 'disponible'),

(8, 'Evaluación finalizada', 'Oliver se encuentra esterilizado y apto para adopción.', 'disponible'),

(9, 'Recuperación nutricional', 'Coco está recuperando peso y energía de manera progresiva.', 'recuperacion'),

(10, 'Tratamiento preventivo', 'Thor inició control veterinario preventivo y evaluación de comportamiento.', 'tratamiento'),

(11, 'Ingreso reciente', 'Kira fue registrada recientemente y está pendiente de evaluación general.', 'evaluacion'),

(12, 'Mascota disponible', 'Simba está listo para adopción y se recomienda un hogar con patio.', 'disponible');
