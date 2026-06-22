package com.example.proyecto.controller;

import com.example.proyecto.model.Mascota;
import com.example.proyecto.model.Usuario;
import com.example.proyecto.service.MascotaService;
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
 * API REST de mascotas.
 * Reglas de permisos:
 *   - Cualquier usuario autenticado puede CREAR una mascota (queda como dueño).
 *   - El DUEÑO puede editar/eliminar sus propias mascotas.
 *   - El ADMIN puede editar/eliminar TODAS.
 *   - El listado y el detalle son públicos.
 */
@RestController
@RequestMapping("/api/mascotas")
public class MascotaController {

    @Autowired
    private MascotaService mascotaService;

    @Autowired
    private UsuarioService usuarioService;

    // ============================================================
    // LECTURA (pública)
    // ============================================================

    /** GET /api/mascotas -> todas las mascotas */
    @GetMapping
    public Map<String, Object> listar() {
        List<Map<String, Object>> mascotas = mascotaService.listarTodas()
                .stream().map(this::aMapa).collect(Collectors.toList());
        Map<String, Object> res = ok();
        res.put("mascotas", mascotas);
        return res;
    }

    /** GET /api/mascotas/mias -> mascotas del usuario en sesión */
    @GetMapping("/mias")
    public ResponseEntity<Map<String, Object>> mias(HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Debes iniciar sesión"));
        }
        List<Map<String, Object>> mascotas = mascotaService.listarPorUsuario(usuarioId)
                .stream().map(this::aMapa).collect(Collectors.toList());
        Map<String, Object> res = ok();
        res.put("mascotas", mascotas);
        return ResponseEntity.ok(res);
    }

    /** GET /api/mascotas/{id} -> detalle */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> detalle(@PathVariable Long id) {
        Optional<Mascota> m = mascotaService.obtenerPorId(id);
        if (m.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Mascota no encontrada"));
        }
        Map<String, Object> res = ok();
        res.put("mascota", aMapa(m.get()));
        return ResponseEntity.ok(res);
    }

    // ============================================================
    // ESCRITURA (requiere sesión / dueño o admin)
    // ============================================================

    /** POST /api/mascotas -> crea una mascota (el dueño es el usuario en sesión) */
    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@RequestBody Map<String, Object> body, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        if (usuarioId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Debes iniciar sesión para registrar una mascota"));
        }
        Mascota m = leerDesdeBody(new Mascota(), body);
        if (m.getNombre() == null || m.getNombre().isBlank()
                || m.getEspecie() == null || m.getEspecie().isBlank()
                || m.getGenero() == null || m.getGenero().isBlank()) {
            return ResponseEntity.badRequest().body(error("Nombre, especie y género son obligatorios"));
        }
        m.setUsuarioId(usuarioId);
        Mascota guardada = mascotaService.crear(m);
        Map<String, Object> res = ok();
        res.put("mascota", aMapa(guardada));
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    /** PUT /api/mascotas/{id} -> edita (dueño o admin) */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> editar(@PathVariable Long id,
                                                      @RequestBody Map<String, Object> body,
                                                      HttpSession session) {
        Optional<Mascota> existente = mascotaService.obtenerPorId(id);
        if (existente.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Mascota no encontrada"));
        }
        ResponseEntity<Map<String, Object>> permiso = verificarPermiso(existente.get(), session);
        if (permiso != null) {
            return permiso;
        }
        Mascota datos = leerDesdeBody(new Mascota(), body);
        Mascota actualizada = mascotaService.actualizar(id, datos);
        Map<String, Object> res = ok();
        res.put("mascota", aMapa(actualizada));
        return ResponseEntity.ok(res);
    }

    /** DELETE /api/mascotas/{id} -> elimina (dueño o admin) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminar(@PathVariable Long id, HttpSession session) {
        Optional<Mascota> existente = mascotaService.obtenerPorId(id);
        if (existente.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Mascota no encontrada"));
        }
        ResponseEntity<Map<String, Object>> permiso = verificarPermiso(existente.get(), session);
        if (permiso != null) {
            return permiso;
        }
        mascotaService.eliminar(id);
        return ResponseEntity.ok(ok());
    }

    // ============================================================
    // HELPERS
    // ============================================================

    /**
     * Devuelve null si el usuario tiene permiso (es dueño o admin);
     * de lo contrario devuelve la respuesta de error correspondiente.
     */
    private ResponseEntity<Map<String, Object>> verificarPermiso(Mascota mascota, HttpSession session) {
        Long usuarioId = (Long) session.getAttribute("usuarioId");
        boolean esAdmin = "ADMIN".equals(session.getAttribute("usuarioRol"));
        if (usuarioId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Debes iniciar sesión"));
        }
        boolean esDueno = usuarioId.equals(mascota.getUsuarioId());
        if (!esAdmin && !esDueno) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(error("Solo el dueño o un administrador pueden modificar esta mascota"));
        }
        return null;
    }

    /** Copia los campos editables desde el body JSON a la mascota. */
    private Mascota leerDesdeBody(Mascota m, Map<String, Object> body) {
        if (body.containsKey("nombre"))       m.setNombre(str(body.get("nombre")));
        if (body.containsKey("especie"))      m.setEspecie(str(body.get("especie")));
        if (body.containsKey("genero"))       m.setGenero(str(body.get("genero")));
        if (body.containsKey("raza"))         m.setRaza(str(body.get("raza")));
        if (body.containsKey("edadMeses"))    m.setEdadMeses(toInt(body.get("edadMeses")));
        if (body.containsKey("descripcion"))  m.setDescripcion(str(body.get("descripcion")));
        if (body.containsKey("fotoUrl"))      m.setFotoUrl(str(body.get("fotoUrl")));
        if (body.containsKey("lugarRescate")) m.setLugarRescate(str(body.get("lugarRescate")));
        if (body.containsKey("estado"))       m.setEstado(str(body.get("estado")));
        if (body.containsKey("condicion"))    m.setCondicion(str(body.get("condicion")));
        if (body.containsKey("responsable"))  m.setResponsable(str(body.get("responsable")));
        if (body.containsKey("disponible"))   m.setDisponible(toBool(body.get("disponible")));
        return m;
    }

    /** Mapa JSON de una mascota, con el nombre del propietario resuelto. */
    private Map<String, Object> aMapa(Mascota m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("nombre", m.getNombre());
        map.put("especie", m.getEspecie());
        map.put("genero", m.getGenero());
        map.put("raza", m.getRaza());
        map.put("edadMeses", m.getEdadMeses());
        map.put("descripcion", m.getDescripcion());
        map.put("fotoUrl", m.getFotoUrl());
        map.put("disponible", m.getDisponible());
        map.put("estado", m.getEstado());
        map.put("condicion", m.getCondicion());
        map.put("responsable", m.getResponsable());
        map.put("lugarRescate", m.getLugarRescate());
        map.put("usuarioId", m.getUsuarioId());
        map.put("propietario", nombrePropietario(m.getUsuarioId()));
        map.put("creadoEn", m.getCreadoEn() != null ? m.getCreadoEn().toString() : null);
        return map;
    }

    private String nombrePropietario(Long usuarioId) {
        if (usuarioId == null) {
            return "Sistema";
        }
        return usuarioService.obtenerUsuarioById(usuarioId)
                .map(Usuario::getNombre)
                .orElse("Sistema");
    }

    private String str(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private Integer toInt(Object o) {
        if (o == null) return 0;
        if (o instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(o.toString().trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private Boolean toBool(Object o) {
        if (o == null) return null;
        if (o instanceof Boolean b) return b;
        String s = o.toString().trim().toLowerCase();
        return s.equals("true") || s.equals("1") || s.equals("si") || s.equals("sí");
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
