package com.example.proyecto.service;

import com.example.proyecto.model.Mascota;
import java.util.List;
import java.util.Optional;

public interface MascotaService {
    List<Mascota> listarTodas();
    List<Mascota> listarPorUsuario(Long usuarioId);
    Optional<Mascota> obtenerPorId(Long id);
    Mascota crear(Mascota mascota);
    Mascota actualizar(Long id, Mascota datos);
    void eliminar(Long id);
}
