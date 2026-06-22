# ============================================================
# Imagen del backend WauPiura (Spring Boot + frontend estático)
# Build en 2 etapas: 1) compilar con Maven  2) imagen ligera para correr
# ============================================================

# ---- Etapa 1: compilar el .jar ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn -B clean package -DskipTests

# ---- Etapa 2: imagen final (solo Java para ejecutar) ----
FROM eclipse-temurin:21-jre
# La app sirve el frontend con la ruta relativa "../frontend",
# por eso el working dir es /app/backend y el frontend va en /app/frontend.
WORKDIR /app/backend
COPY --from=build /build/target/*.jar app.jar
COPY frontend /app/frontend
COPY images /app/images
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
