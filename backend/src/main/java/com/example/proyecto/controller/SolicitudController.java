package com.example.proyecto.controller;

import com.example.proyecto.model.Mascota;
import com.example.proyecto.model.Solicitud;
import com.example.proyecto.model.Usuario;
import com.example.proyecto.service.MascotaService;
import com.example.proyecto.service.SolicitudService;
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
import java.util.Set;
import java.util.stream.Collectors;

/**
 * API REST de solicitudes de adopción.
 *   - Cualquier usuario autenticado puede CREAR una solicitud.
 *   - El usuario ve SUS solicitudes (/mias).
 *   - El ADMIN ve TODAS (con datos del solicitante: nombre, email, teléfono)
 *     y puede cambiar el estado (aprobar / rechazar).
 */
@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    private static final Set<String> ESTADOS_VALIDOS = Set.of("pendiente", "aprobada", "rechazada");

    @Autowired private SolicitudService solicitudService;
    @Autowired private UsuarioService usuarioService;
    @Autowired private MascotaService mascotaService;

    /** POST /api/solicitudes  body: { mascotaId, mensaje } */
    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@RequestBody Map<String, Object> body, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Debes iniciar sesión para solicitar una adopción"));
        }
        Long mascotaId = toLong(body.get("mascotaId"));
        String mensaje = body.get("mensaje") != null ? body.get("mensaje").toString().trim() : "";

        if (mascotaId == null) {
            return ResponseEntity.badRequest().body(error("Falta la mascota"));
        }
        if (mensaje.isEmpty()) {
            return ResponseEntity.badRequest().body(error("El mensaje de motivación es obligatorio"));
        }
        if (mascotaService.obtenerPorId(mascotaId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("La mascota no existe"));
        }

        Solicitud s = new Solicitud();
        s.setMascotaId(mascotaId);
        s.setUsuarioId(usuarioId);
        s.setMensaje(mensaje);
        Solicitud guardada = solicitudService.crear(s);

        Map<String, Object> res = ok();
        res.put("solicitud", aMapa(guardada));
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    /** GET /api/solicitudes  -> todas (solo admin) */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(HttpSession session) {
        if (!esAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acceso solo para administradores"));
        }
        List<Map<String, Object>> solicitudes = solicitudService.listarTodas()
                .stream().map(this::aMapa).collect(Collectors.toList());
        Map<String, Object> res = ok();
        res.put("solicitudes", solicitudes);
        return ResponseEntity.ok(res);
    }

    /** GET /api/solicitudes/mias  -> solicitudes del usuario en sesión */
    @GetMapping("/mias")
    public ResponseEntity<Map<String, Object>> mias(HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Debes iniciar sesión"));
        }
        List<Map<String, Object>> solicitudes = solicitudService.listarPorUsuario(usuarioId)
                .stream().map(this::aMapa).collect(Collectors.toList());
        Map<String, Object> res = ok();
        res.put("solicitudes", solicitudes);
        return ResponseEntity.ok(res);
    }

    /** PUT /api/solicitudes/{id}/estado  body: { estado } (solo admin) */
    @PutMapping("/{id}/estado")
    public ResponseEntity<Map<String, Object>> cambiarEstado(@PathVariable Long id,
                                                            @RequestBody Map<String, String> body,
                                                            HttpSession session) {
        if (!esAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acceso solo para administradores"));
        }
        String estado = body.getOrDefault("estado", "").trim().toLowerCase();
        if (!ESTADOS_VALIDOS.contains(estado)) {
            return ResponseEntity.badRequest().body(error("Estado inválido (pendiente, aprobada o rechazada)"));
        }
        Solicitud actualizada = solicitudService.cambiarEstado(id, estado);
        if (actualizada == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Solicitud no encontrada"));
        }
        Map<String, Object> res = ok();
        res.put("solicitud", aMapa(actualizada));
        return ResponseEntity.ok(res);
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private boolean esAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("usuarioRol"));
    }

    /** Mapa JSON enriquecido con datos del solicitante y de la mascota. */
    private Map<String, Object> aMapa(Solicitud s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("mensaje", s.getMensaje());
        map.put("estado", s.getEstado());
        map.put("creadoEn", s.getCreadoEn() != null ? s.getCreadoEn().toString() : null);

        // Datos del solicitante (incluye el teléfono que pidió el admin)
        Optional<Usuario> u = usuarioService.obtenerUsuarioById(s.getUsuarioId());
        Map<String, Object> usuario = new LinkedHashMap<>();
        usuario.put("id", s.getUsuarioId());
        usuario.put("nombre", u.map(Usuario::getNombre).orElse("Usuario eliminado"));
        usuario.put("email", u.map(Usuario::getEmail).orElse(null));
        usuario.put("telefono", u.map(Usuario::getTelefono).orElse(null));
        map.put("usuario", usuario);

        // Datos de la mascota
        Optional<Mascota> m = mascotaService.obtenerPorId(s.getMascotaId());
        Map<String, Object> mascota = new LinkedHashMap<>();
        mascota.put("id", s.getMascotaId());
        mascota.put("nombre", m.map(Mascota::getNombre).orElse("Mascota eliminada"));
        mascota.put("especie", m.map(Mascota::getEspecie).orElse(null));
        map.put("mascota", mascota);

        return map;
    }

    private Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
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
}
