package com.example.proyecto.service;

import com.example.proyecto.model.Seguimiento;
import com.example.proyecto.repository.SeguimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SeguimientoServiceImpl implements SeguimientoService {

    @Autowired
    private SeguimientoRepository seguimientoRepository;

    @Override
    public List<Seguimiento> listarPorMascota(Long mascotaId) {
        return seguimientoRepository.findByMascotaIdOrderByFechaDesc(mascotaId);
    }

    @Override
    public Seguimiento crear(Seguimiento seguimiento) {
        return seguimientoRepository.save(seguimiento);
    }

    @Override
    public void eliminar(Long id) {
        seguimientoRepository.deleteById(id);
    }
}
