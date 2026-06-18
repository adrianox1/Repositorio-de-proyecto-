package com.example.proyecto.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración web:
 *  - Sirve el frontend estático (carpeta ../frontend) desde el mismo servidor
 *    Spring Boot, de modo que las llamadas a /api/** comparten origen (sin CORS).
 *  - Habilita CORS en /api/** como respaldo si el frontend se abre con Live Server.
 *
 * Las rutas tipo "file:../frontend/..." son relativas al directorio de trabajo,
 * que al ejecutar `mvnw spring-boot:run` dentro de /backend es la carpeta backend.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String FRONTEND = "file:../frontend/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/views/**").addResourceLocations(FRONTEND + "views/");
        registry.addResourceHandler("/styles/**").addResourceLocations(FRONTEND + "styles/");
        registry.addResourceHandler("/scripts/**").addResourceLocations(FRONTEND + "scripts/");
        registry.addResourceHandler("/images/**")
                .addResourceLocations(FRONTEND + "images/", "file:../images/");
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Al entrar a http://localhost:8080/ redirige a la página de inicio
        registry.addRedirectViewController("/", "/views/index.html");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowCredentials(true);
    }
}
