package com.example.proyecto.repository;

import com.example.proyecto.model.Seguimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SeguimientoRepository extends JpaRepository<Seguimiento, Long> {
    List<Seguimiento> findByMascotaIdOrderByFechaDesc(Long mascotaId);
}
