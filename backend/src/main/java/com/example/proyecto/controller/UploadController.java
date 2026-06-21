package com.example.proyecto.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Subida de imágenes de mascotas al servidor.
 * Guarda el archivo en disco y devuelve la ruta pública (/uploads/mascotas/...)
 * que luego se almacena en el campo foto_url de la mascota.
 */
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> EXTENSIONES = Set.of("jpg", "jpeg", "png", "gif", "webp");

    /** POST /api/uploads/mascota  (multipart, campo "archivo") */
    @PostMapping("/mascota")
    public ResponseEntity<Map<String, Object>> subirMascota(@RequestParam("archivo") MultipartFile archivo,
                                                            HttpSession session) {
        if (session.getAttribute("usuarioId") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Debes iniciar sesión para subir imágenes"));
        }
        if (archivo == null || archivo.isEmpty()) {
            return ResponseEntity.badRequest().body(error("Selecciona una imagen"));
        }
        String contentType = archivo.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(error("El archivo debe ser una imagen"));
        }
        String ext = extension(archivo.getOriginalFilename());
        if (!EXTENSIONES.contains(ext)) {
            return ResponseEntity.badRequest().body(error("Formato no permitido. Usa jpg, png, gif o webp"));
        }

        try {
            Path dir = Paths.get(uploadDir, "mascotas");
            Files.createDirectories(dir);
            String nombreArchivo = UUID.randomUUID() + "." + ext;
            Path destino = dir.resolve(nombreArchivo);
            Files.copy(archivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("ok", true);
            res.put("url", "/uploads/mascotas/" + nombreArchivo);
            return ResponseEntity.ok(res);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("No se pudo guardar la imagen: " + e.getMessage()));
        }
    }

    private String extension(String nombre) {
        if (nombre == null) return "";
        int punto = nombre.lastIndexOf('.');
        return (punto == -1) ? "" : nombre.substring(punto + 1).toLowerCase();
    }

    private Map<String, Object> error(String mensaje) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ok", false);
        m.put("error", mensaje);
        return m;
    }
}
