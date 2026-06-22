# WauPiura 🐾 — Plataforma de Adopción de Mascotas

[![CI - Backend](https://github.com/adrianox1/Repositorio-de-proyecto-/actions/workflows/ci.yml/badge.svg?branch=grissel)](https://github.com/adrianox1/Repositorio-de-proyecto-/actions/workflows/ci.yml)

Plataforma web para gestionar la adopción de mascotas rescatadas en Piura.

## Tecnologías
- **Backend:** Spring Boot (Java 21) + Spring Data JPA
- **Base de datos:** MySQL
- **Frontend:** HTML + CSS + JavaScript
- **CI:** GitHub Actions (compila y corre tests en cada push)

## Estructura
```
Repositorio-de-proyecto-/
├── backend/      ← API REST en Spring Boot
├── frontend/     ← Vistas (HTML), estilos (CSS) y scripts (JS)
├── database/     ← schema.sql (instalación limpia de la BD)
└── .github/      ← Workflow de integración continua
```

## Cómo ejecutarlo localmente
1. Tener instalados **MySQL**, **JDK 21** y **Maven**.
2. Crear la base de datos ejecutando `database/schema.sql` en MySQL.
3. Ajustar usuario/contraseña en `backend/src/main/resources/application.properties` si difieren.
4. Levantar el backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
5. Abrir en el navegador: `http://localhost:8080/views/index.html`

## Cómo ejecutarlo con Docker (recomendado)
Con Docker **no necesitas instalar MySQL, JDK ni Maven**, solo Docker Desktop.

```bash
docker compose up --build
```

Eso levanta dos contenedores: la base de datos MySQL (con las tablas y usuarios de prueba ya creados) y el backend. Luego abre:
`http://localhost:8080/views/index.html`

Para detenerlo: `Ctrl + C` y luego `docker compose down` (agrega `-v` si quieres borrar también los datos).

> La base de datos también queda accesible para MySQL Workbench en `127.0.0.1:3307`.

## Usuarios de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@waupiura.com | admin123 |
| Usuario | diego123@gmail.com | diego123 |
