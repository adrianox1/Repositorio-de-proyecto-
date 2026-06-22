package com.example.proyecto.controller;

import com.example.proyecto.model.Seguimiento;
import com.example.proyecto.service.MascotaService;
import com.example.proyecto.service.SeguimientoService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * API REST del historial de seguimiento clínico de una mascota.
 *   - El listado por mascota es público (lo usa la vista de seguimiento).
 *   - Crear/eliminar hitos es solo para el ADMIN.
 */
@RestController
@RequestMapping("/api/seguimientos")
public class SeguimientoController {

    @Autowired private SeguimientoService seguimientoService;
    @Autowired private MascotaService mascotaService;

    /** GET /api/seguimientos/mascota/{mascotaId} -> historial */
    @GetMapping("/mascota/{mascotaId}")
    public Map<String, Object> porMascota(@PathVariable Long mascotaId) {
        List<Map<String, Object>> hitos = seguimientoService.listarPorMascota(mascotaId)
                .stream().map(this::aMapa).collect(Collectors.toList());
        Map<String, Object> res = ok();
        res.put("seguimientos", hitos);
        return res;
    }

    /** POST /api/seguimientos  body: { mascotaId, titulo, descripcion, estado } (admin) */
    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@RequestBody Map<String, Object> body, HttpSession session) {
        if (!"ADMIN".equals(session.getAttribute("usuarioRol"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acceso solo para administradores"));
        }
        Long mascotaId = toLong(body.get("mascotaId"));
        String titulo = str(body.get("titulo"));
        String descripcion = str(body.get("descripcion"));
        String estado = str(body.get("estado"));

        if (mascotaId == null || titulo == null || descripcion == null) {
            return ResponseEntity.badRequest().body(error("Mascota, título y descripción son obligatorios"));
        }
        if (mascotaService.obtenerPorId(mascotaId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("La mascota no existe"));
        }

        Seguimiento s = new Seguimiento();
        s.setMascotaId(mascotaId);
        s.setTitulo(titulo);
        s.setDescripcion(descripcion);
        if (estado != null) s.setEstado(estado);
        Seguimiento guardado = seguimientoService.crear(s);

        Map<String, Object> res = ok();
        res.put("seguimiento", aMapa(guardado));
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private Map<String, Object> aMapa(Seguimiento s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("mascotaId", s.getMascotaId());
        map.put("titulo", s.getTitulo());
        map.put("descripcion", s.getDescripcion());
        map.put("estado", s.getEstado());
        map.put("fecha", s.getFecha() != null ? s.getFecha().toString() : null);
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

    private String str(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
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
