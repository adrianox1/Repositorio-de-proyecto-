package com.example.proyecto.service;

import com.example.proyecto.model.Donacion;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface DonacionService {
    Donacion registrarDonacionPendiente(BigDecimal monto, String numeroOperacion, MultipartFile fotoBoucher, Long usuarioId);
    List<Donacion> listarPorEstado(String estado);
    Donacion cambiarEstado(Long id, String estado);
    BigDecimal obtenerTotalAprobado();
}
