package com.example.proyecto.controller;

import com.example.proyecto.model.Donacion;
import com.example.proyecto.service.DonacionService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/donaciones")
public class DonacionController {

    private static final Set<String> ESTADOS_VALIDOS = Set.of("PENDIENTE", "APROBADO", "RECHAZADO");

    @Autowired
    private DonacionService donacionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> crearDonacion(
            @RequestParam("monto") String montoStr,
            @RequestParam("numeroOperacion") String numeroOperacion,
            @RequestParam("usuarioId") Long usuarioId,
            @RequestParam(value = "fotoBoucher", required = false) MultipartFile fotoBoucher,
            HttpSession session) {

        Long usuarioSesion = (Long) session.getAttribute("usuarioId");
        if (usuarioSesion == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Debes iniciar sesión para donar"));
        }
        if (usuarioId == null || !usuarioSesion.equals(usuarioId)) {
            return ResponseEntity.badRequest().body(error("El ID de usuario no coincide con la sesión"));
        }

        if (montoStr == null || montoStr.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(error("El monto de la donación es obligatorio"));
        }
        if (numeroOperacion == null || numeroOperacion.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(error("El código de operación es obligatorio"));
        }

        try {
            BigDecimal monto = new BigDecimal(montoStr.trim());
            if (monto.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(error("El monto debe ser mayor que cero"));
            }
            Donacion donacion = donacionService.registrarDonacionPendiente(monto, numeroOperacion, fotoBoucher, usuarioId);
            Map<String, Object> res = ok();
            res.put("donacion", aMapa(donacion));
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (NumberFormatException ex) {
            return ResponseEntity.badRequest().body(error("El monto debe ser un número válido"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(error(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error("No se pudo procesar la donación"));
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listarPorEstado(@RequestParam("estado") String estado, HttpSession session) {
        if (!esAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acceso solo para administradores"));
        }
        if (estado == null || estado.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(error("El estado es obligatorio"));
        }
        String estadoUpper = estado.toUpperCase().trim();
        if (!ESTADOS_VALIDOS.contains(estadoUpper)) {
            return ResponseEntity.badRequest().body(error("Estado inválido"));
        }
        List<Donacion> donaciones = donacionService.listarPorEstado(estadoUpper);
        Map<String, Object> res = ok();
        res.put("donaciones", donaciones.stream().map(this::aMapa).collect(Collectors.toList()));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/total")
    public ResponseEntity<Map<String, Object>> totalAprobado() {
        BigDecimal total = donacionService.obtenerTotalAprobado();
        Map<String, Object> res = ok();
        res.put("total", total);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Map<String, Object>> cambiarEstado(@PathVariable Long id,
                                                             @RequestBody Map<String, String> body,
                                                             HttpSession session) {
        if (!esAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acceso solo para administradores"));
        }
        String estado = body.getOrDefault("estado", "").trim().toUpperCase();
        if (!ESTADOS_VALIDOS.contains(estado) || estado.equals("PENDIENTE")) {
            return ResponseEntity.badRequest().body(error("Estado inválido. Solo APROBADO o RECHAZADO son válidos."));
        }
        Donacion actualizada = donacionService.cambiarEstado(id, estado);
        if (actualizada == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Donación no encontrada"));
        }
        Map<String, Object> res = ok();
        res.put("donacion", aMapa(actualizada));
        return ResponseEntity.ok(res);
    }

    private boolean esAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("usuarioRol"));
    }

    private Map<String, Object> aMapa(Donacion d) {
        Map<String, Object> donacion = new LinkedHashMap<>();
        donacion.put("id", d.getId());
        donacion.put("monto", d.getMonto());
        donacion.put("numeroOperacion", d.getNumeroOperacion());
        donacion.put("fotoBoucherUrl", d.getFotoBoucherUrl());
        donacion.put("estado", d.getEstado());
        donacion.put("fechaDonacion", d.getFechaDonacion() != null ? d.getFechaDonacion().toString() : null);
        if (d.getUsuario() != null) {
            Map<String, Object> usuario = new LinkedHashMap<>();
            usuario.put("id", d.getUsuario().getId());
            usuario.put("nombre", d.getUsuario().getNombre());
            usuario.put("email", d.getUsuario().getEmail());
            donacion.put("usuario", usuario);
        }
        return donacion;
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
