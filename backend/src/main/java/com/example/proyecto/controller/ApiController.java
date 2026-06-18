package com.example.proyecto.controller;

import com.example.proyecto.model.Usuario;
import com.example.proyecto.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * API REST en JSON que reemplaza los antiguos endpoints PHP.
 * El frontend (carpeta ../frontend) consume estas rutas con fetch().
 *
 * Contrato general de respuesta:
 *   éxito  -> { "ok": true, ... }
 *   error  -> { "ok": false, "error": "mensaje" }
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private UsuarioService usuarioService;

    // ============================================================
    // AUTENTICACIÓN
    // ============================================================

    /** POST /api/login  body: { "correo": "...", "contrasena": "..." } */
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body, HttpSession session) {
        String correo = body.getOrDefault("correo", "").trim().toLowerCase();
        String contra = body.getOrDefault("contrasena", "");

        if (correo.isEmpty() || contra.isEmpty()) {
            return error("Correo y contraseña son requeridos");
        }
        if (usuarioService.validarCredenciales(correo, contra)) {
            Optional<Usuario> u = usuarioService.buscarPorEmail(correo);
            if (u.isPresent()) {
                session.setAttribute("usuarioId", u.get().getId());
                session.setAttribute("usuarioRol", u.get().getRol().name());
                Map<String, Object> res = ok();
                res.put("usuario", aMapaPublico(u.get()));
                return res;
            }
        }
        return error("Correo o contraseña incorrectos");
    }

    /** GET /api/me  -> usuario de la sesión activa */
    @GetMapping("/me")
    public Map<String, Object> me(HttpSession session) {
        Long id = (Long) session.getAttribute("usuarioId");
        if (id == null) {
            return error("No hay sesión activa");
        }
        Optional<Usuario> u = usuarioService.obtenerUsuarioById(id);
        if (u.isEmpty()) {
            return error("Usuario no encontrado");
        }
        Map<String, Object> res = ok();
        res.put("usuario", aMapaPublico(u.get()));
        return res;
    }

    /** GET /api/logout  -> cierra la sesión */
    @GetMapping("/logout")
    public Map<String, Object> logout(HttpSession session) {
        session.invalidate();
        return ok();
    }

    // ============================================================
    // GESTIÓN DE USUARIOS (solo ADMIN)
    // ============================================================

    /** GET /api/usuarios  -> lista todos los usuarios */
    @GetMapping("/usuarios")
    public ResponseEntity<Map<String, Object>> listarUsuarios(HttpSession session) {
        if (!esAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acceso solo para administradores"));
        }
        List<Map<String, Object>> usuarios = usuarioService.obtenerTodosUsuarios()
                .stream()
                .map(this::aMapaPublico)
                .collect(Collectors.toList());
        Map<String, Object> res = ok();
        res.put("usuarios", usuarios);
        return ResponseEntity.ok(res);
    }

    /** POST /api/usuarios  -> crea un nuevo usuario */
    @PostMapping("/usuarios")
    public ResponseEntity<Map<String, Object>> crearUsuario(@RequestBody Map<String, String> body, HttpSession session) {
        if (!esAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acceso solo para administradores"));
        }
        String nombre = body.getOrDefault("nombre", "").trim();
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        String password = body.getOrDefault("password", "");
        String rolStr = body.getOrDefault("rol", "USUARIO").trim().toUpperCase();

        if (nombre.isEmpty() || email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(error("Nombre, email y contraseña son requeridos"));
        }
        if (usuarioService.existeEmail(email)) {
            return ResponseEntity.badRequest().body(error("El email ya está registrado"));
        }

        Usuario nuevo = new Usuario(nombre, email, password);
        nuevo.setTelefono(emptyToNull(body.get("telefono")));
        nuevo.setDireccion(emptyToNull(body.get("direccion")));
        try {
            nuevo.setRol(Usuario.Rol.valueOf(rolStr));
        } catch (IllegalArgumentException ex) {
            nuevo.setRol(Usuario.Rol.USUARIO);
        }

        Usuario guardado = usuarioService.registrarUsuario(nuevo);
        Map<String, Object> res = ok();
        res.put("usuario", aMapaPublico(guardado));
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    /** DELETE /api/usuarios/{id}  -> elimina un usuario */
    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Map<String, Object>> eliminarUsuario(@PathVariable Long id, HttpSession session) {
        if (!esAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acceso solo para administradores"));
        }
        Long actual = (Long) session.getAttribute("usuarioId");
        if (id.equals(actual)) {
            return ResponseEntity.badRequest().body(error("No puedes eliminar tu propia cuenta"));
        }
        if (usuarioService.obtenerUsuarioById(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Usuario no encontrado"));
        }
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.ok(ok());
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private boolean esAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("usuarioRol"));
    }

    /** Mapa público de un usuario (nunca incluye la contraseña). */
    private Map<String, Object> aMapaPublico(Usuario u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("nombre", u.getNombre());
        m.put("email", u.getEmail());
        m.put("rol", u.getRol() != null ? u.getRol().name() : null);
        m.put("telefono", u.getTelefono());
        m.put("direccion", u.getDireccion());
        m.put("activo", u.getActivo());
        m.put("fechaRegistro", u.getFechaRegistro() != null ? u.getFechaRegistro().toString() : null);
        return m;
    }

    private Map<String, Object> ok() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ok", true);
        return m;
    }

    private Map<String, Object> error(String mensaje) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ok", false);
        m.put("error", mensaje);
        return m;
    }

    private String emptyToNull(String s) {
        if (s == null) return null;
        s = s.trim();
        return s.isEmpty() ? null : s;
    }
}
