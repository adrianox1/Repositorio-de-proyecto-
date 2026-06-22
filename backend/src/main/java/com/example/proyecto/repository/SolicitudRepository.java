package com.example.proyecto.repository;

import com.example.proyecto.model.Solicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {
    List<Solicitud> findAllByOrderByIdDesc();
    List<Solicitud> findByUsuarioIdOrderByIdDesc(Long usuarioId);
}
