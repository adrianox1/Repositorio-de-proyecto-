package com.example.proyecto.service;

import com.example.proyecto.model.Solicitud;
import java.util.List;
import java.util.Optional;

public interface SolicitudService {
    List<Solicitud> listarTodas();
    List<Solicitud> listarPorUsuario(Long usuarioId);
    Optional<Solicitud> obtenerPorId(Long id);
    Solicitud crear(Solicitud solicitud);
    Solicitud cambiarEstado(Long id, String estado);
}
