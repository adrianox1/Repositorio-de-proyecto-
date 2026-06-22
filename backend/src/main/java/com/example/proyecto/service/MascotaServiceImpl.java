package com.example.proyecto.service;

import com.example.proyecto.model.Mascota;
import com.example.proyecto.repository.MascotaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class MascotaServiceImpl implements MascotaService {

    @Autowired
    private MascotaRepository mascotaRepository;

    @Override
    public List<Mascota> listarTodas() {
        return mascotaRepository.findAllByOrderByIdDesc();
    }

    @Override
    public List<Mascota> listarPorUsuario(Long usuarioId) {
        return mascotaRepository.findByUsuarioId(usuarioId);
    }

    @Override
    public Optional<Mascota> obtenerPorId(Long id) {
        return mascotaRepository.findById(id);
    }

    @Override
    public Mascota crear(Mascota mascota) {
        return mascotaRepository.save(mascota);
    }

    @Override
    public Mascota actualizar(Long id, Mascota datos) {
        Optional<Mascota> existente = mascotaRepository.findById(id);
        if (existente.isEmpty()) {
            return null;
        }
        Mascota m = existente.get();
        m.setNombre(datos.getNombre());
        m.setEspecie(datos.getEspecie());
        m.setGenero(datos.getGenero());
        m.setRaza(datos.getRaza());
        m.setEdadMeses(datos.getEdadMeses());
        m.setDescripcion(datos.getDescripcion());
        m.setFotoUrl(datos.getFotoUrl());
        m.setLugarRescate(datos.getLugarRescate());
        // Campos que normalmente gestiona el refugio/admin
        if (datos.getEstado() != null)      m.setEstado(datos.getEstado());
        if (datos.getCondicion() != null)   m.setCondicion(datos.getCondicion());
        if (datos.getResponsable() != null) m.setResponsable(datos.getResponsable());
        if (datos.getDisponible() != null)  m.setDisponible(datos.getDisponible());
        return mascotaRepository.save(m);
    }

    @Override
    public void eliminar(Long id) {
        mascotaRepository.deleteById(id);
    }
}
