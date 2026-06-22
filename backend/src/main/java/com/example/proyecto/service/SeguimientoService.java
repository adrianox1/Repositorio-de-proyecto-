package com.example.proyecto.service;

import com.example.proyecto.model.Seguimiento;
import java.util.List;

public interface SeguimientoService {
    List<Seguimiento> listarPorMascota(Long mascotaId);
    Seguimiento crear(Seguimiento seguimiento);
    void eliminar(Long id);
}
