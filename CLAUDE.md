# CLAUDE.md — Proyecto WauPiura (Sistema de Adopción de Mascotas)

## Descripción general
Plataforma web de adopción de mascotas llamada **WauPiura**.
- **Frontend:** HTML + CSS + JS vanilla (rama grissel)
- **Backend:** Spring Boot (Java 21) — reemplaza el PHP anterior
- **Base de datos:** MySQL (`WauPiura`)

## Estructura del repositorio
```
Repositorio-de-proyecto-/
├── backend/                        ← Backend Java (Spring Boot)
│   ├── mvnw / mvnw.cmd
│   ├── pom.xml
│   └── src/
│       └── main/java/com/example/proyecto/
│           ├── ProyectoApplication.java
│           ├── controller/UsuarioController.java
│           ├── model/Usuario.java
│           ├── repository/UsuarioRepository.java
│           └── service/UsuarioService.java + UsuarioServiceImpl.java
├── frontend/                       ← Frontend web
│   ├── views/                      ← Páginas HTML
│   ├── styles/                     ← Hojas de estilo CSS
│   └── scripts/                    ← Lógica JavaScript
├── database/
│   └── schema.sql                  ← Esquema inicial de BD
├── images/
├── .env.example
└── .gitignore
```

## Stack tecnológico

### Backend (Java)
- **Spring Boot** 4.0.6, Java 21
- **Spring Data JPA** + Hibernate (`ddl-auto=update`)
- **Thymeleaf** para vistas del servidor
- **Lombok** para reducir boilerplate
- **MySQL** — `jdbc:mysql://localhost:3306/WauPiura`

### Frontend
- HTML en `frontend/views/`
- CSS en `frontend/styles/`
- JS en `frontend/scripts/`

## Comandos principales

### Ejecutar el backend
```bash
cd backend
./mvnw spring-boot:run        # Linux/Mac
mvnw.cmd spring-boot:run      # Windows
```

### Construir JAR
```bash
cd backend
./mvnw clean package
```

### Base de datos
- Motor: MySQL, base de datos: `WauPiura`
- Schema inicial: `database/schema.sql`
- Credenciales en: `backend/src/main/resources/application.properties`
- Por defecto: usuario `root`, contraseña `admin`

## Arquitectura del backend Java

Patrón **Controller → Service → Repository**:

| Capa | Paquete | Responsabilidad |
|---|---|---|
| Controller | `controller/` | Recibe peticiones HTTP, gestiona sesión |
| Service | `service/` | Lógica de negocio (interface + impl) |
| Repository | `repository/` | Acceso a BD con Spring Data JPA |
| Model | `model/` | Entidades JPA (ej. `Usuario`) |

## Convenciones
- Clases en PascalCase, métodos en camelCase
- Servicios: siempre interface (`UsuarioService`) + implementación (`UsuarioServiceImpl`)
- Sesión HTTP con `HttpSession` de Jakarta
- Endpoints de usuario bajo `/usuarios`

## Notas importantes
- El backend PHP fue eliminado. NO recrear archivos `.php`
- La rama activa es **grissel**
- El frontend consume el backend Java vía Thymeleaf o REST
