package com.example.proyecto.service;

import com.example.proyecto.model.Solicitud;
import com.example.proyecto.repository.SolicitudRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class SolicitudServiceImpl implements SolicitudService {

    @Autowired
    private SolicitudRepository solicitudRepository;

    @Override
    public List<Solicitud> listarTodas() {
        return solicitudRepository.findAllByOrderByIdDesc();
    }

    @Override
    public List<Solicitud> listarPorUsuario(Long usuarioId) {
        return solicitudRepository.findByUsuarioIdOrderByIdDesc(usuarioId);
    }

    @Override
    public Optional<Solicitud> obtenerPorId(Long id) {
        return solicitudRepository.findById(id);
    }

    @Override
    public Solicitud crear(Solicitud solicitud) {
        return solicitudRepository.save(solicitud);
    }

    @Override
    public Solicitud cambiarEstado(Long id, String estado) {
        Optional<Solicitud> existente = solicitudRepository.findById(id);
        if (existente.isEmpty()) {
            return null;
        }
        Solicitud s = existente.get();
        s.setEstado(estado);
        return solicitudRepository.save(s);
    }
}
