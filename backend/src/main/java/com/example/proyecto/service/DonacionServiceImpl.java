package com.example.proyecto.service;

import com.example.proyecto.model.Donacion;
import com.example.proyecto.model.Usuario;
import com.example.proyecto.repository.DonacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class DonacionServiceImpl implements DonacionService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> EXTENSIONES_PERMITIDAS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    @Autowired
    private DonacionRepository donacionRepository;

    @Autowired
    private UsuarioService usuarioService;

    @Override
    public Donacion registrarDonacionPendiente(BigDecimal monto, String numeroOperacion, MultipartFile fotoBoucher, Long usuarioId) {
        if (monto == null || monto.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor que cero");
        }
        if (numeroOperacion == null || numeroOperacion.trim().isEmpty()) {
            throw new IllegalArgumentException("El código de operación es obligatorio");
        }

        Optional<Usuario> usuarioOpt = usuarioService.obtenerUsuarioById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            throw new IllegalArgumentException("Usuario no encontrado");
        }

        Donacion donacion = new Donacion();
        donacion.setMonto(monto);
        donacion.setNumeroOperacion(numeroOperacion.trim());
        donacion.setEstado("PENDIENTE");
        donacion.setUsuario(usuarioOpt.get());
        donacion.setFechaDonacion(java.time.LocalDateTime.now());

        if (fotoBoucher != null && !fotoBoucher.isEmpty()) {
            donacion.setFotoBoucherUrl(guardarBoucher(fotoBoucher));
        }

        return donacionRepository.save(donacion);
    }

    @Override
    public List<Donacion> listarPorEstado(String estado) {
        if (estado == null) {
            throw new IllegalArgumentException("El estado es obligatorio");
        }
        return donacionRepository.findByEstadoOrderByFechaDonacionDesc(estado.toUpperCase().trim());
    }

    @Override
    public Donacion cambiarEstado(Long id, String estado) {
        if (id == null) {
            throw new IllegalArgumentException("El ID de la donación es obligatorio");
        }
        if (estado == null || (!estado.equalsIgnoreCase("APROBADO") && !estado.equalsIgnoreCase("RECHAZADO") && !estado.equalsIgnoreCase("PENDIENTE"))) {
            throw new IllegalArgumentException("Estado inválido");
        }
        Optional<Donacion> existente = donacionRepository.findById(id);
        if (existente.isEmpty()) {
            return null;
        }
        Donacion donacion = existente.get();
        donacion.setEstado(estado.toUpperCase().trim());
        return donacionRepository.save(donacion);
    }

    @Override
    public BigDecimal obtenerTotalAprobado() {
        BigDecimal total = donacionRepository.obtenerTotalAprobado();
        return total != null ? total : BigDecimal.ZERO;
    }

    private String guardarBoucher(MultipartFile archivo) {
        String original = archivo.getOriginalFilename();
        String extension = obtenerExtension(original);
        if (extension.isEmpty() || !EXTENSIONES_PERMITIDAS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("Formato de imagen no válido. Usa jpg, png, gif o webp");
        }
        try {
            Path carpeta = Paths.get(uploadDir, "bouchers");
            Files.createDirectories(carpeta);
            String nombreArchivo = UUID.randomUUID() + "." + extension;
            Path destino = carpeta.resolve(nombreArchivo);
            Files.copy(archivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/bouchers/" + nombreArchivo;
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar el comprobante de pago", e);
        }
    }

    private String obtenerExtension(String nombre) {
        if (nombre == null || !nombre.contains(".")) {
            return "";
        }
        String ext = nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase();
        return ext;
    }
}
