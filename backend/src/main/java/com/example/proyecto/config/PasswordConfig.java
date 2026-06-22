package com.example.proyecto.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Expone un PasswordEncoder (BCrypt) para inyectar en los servicios.
 * Usamos solo spring-security-crypto, así que NO se activa el muro de
 * login de Spring Security: el control de acceso lo sigue manejando la sesión.
 */
@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
