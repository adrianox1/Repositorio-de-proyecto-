package com.example.proyecto.repository;

import com.example.proyecto.model.Donacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DonacionRepository extends JpaRepository<Donacion, Long> {
    List<Donacion> findByEstadoOrderByFechaDonacionDesc(String estado);

    @Query("SELECT COALESCE(SUM(d.monto), 0) FROM Donacion d WHERE d.estado = 'APROBADO'")
    BigDecimal obtenerTotalAprobado();
}
