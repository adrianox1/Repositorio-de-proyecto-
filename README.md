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

## Usuarios de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@waupiura.com | admin123 |
| Usuario | diego123@gmail.com | diego123 |
