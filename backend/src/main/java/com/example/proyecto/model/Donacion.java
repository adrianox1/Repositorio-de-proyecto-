package com.example.proyecto.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "donaciones")
public class Donacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "numero_operacion", nullable = false, length = 20)
    private String numeroOperacion;

    @Column(name = "foto_boucher_url", length = 500)
    private String fotoBoucherUrl;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(name = "fecha_donacion", nullable = false)
    private LocalDateTime fechaDonacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    public Donacion() {
        this.estado = "PENDIENTE";
        this.fechaDonacion = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.estado == null) {
            this.estado = "PENDIENTE";
        }
        if (this.fechaDonacion == null) {
            this.fechaDonacion = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getNumeroOperacion() {
        return numeroOperacion;
    }

    public void setNumeroOperacion(String numeroOperacion) {
        this.numeroOperacion = numeroOperacion;
    }

    public String getFotoBoucherUrl() {
        return fotoBoucherUrl;
    }

    public void setFotoBoucherUrl(String fotoBoucherUrl) {
        this.fotoBoucherUrl = fotoBoucherUrl;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaDonacion() {
        return fechaDonacion;
    }

    public void setFechaDonacion(LocalDateTime fechaDonacion) {
        this.fechaDonacion = fechaDonacion;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
}
