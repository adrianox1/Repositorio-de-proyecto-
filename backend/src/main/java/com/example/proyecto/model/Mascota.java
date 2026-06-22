package com.example.proyecto.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mascotas")
public class Mascota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 20)
    private String especie;   // perro, gato, otro

    @Column(nullable = false, length = 10)
    private String genero;    // macho, hembra

    @Column(length = 100)
    private String raza;

    @Column(name = "edad_meses", nullable = false)
    private Integer edadMeses = 0;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(nullable = false)
    private Boolean disponible = true;

    @Column(nullable = false, length = 20)
    private String estado = "evaluacion";   // evaluacion, tratamiento, recuperacion, disponible

    @Column(length = 150)
    private String condicion;

    @Column(length = 100)
    private String responsable;

    @Column(name = "lugar_rescate", length = 150)
    private String lugarRescate;

    @Column(name = "ultima_actualizacion", nullable = false)
    private LocalDateTime ultimaActualizacion;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    // Dueño de la mascota (quien la registró). NULL = mascota del sistema/seed.
    @Column(name = "usuario_id")
    private Long usuarioId;

    @PrePersist
    public void prePersist() {
        LocalDateTime ahora = LocalDateTime.now();
        if (creadoEn == null) creadoEn = ahora;
        ultimaActualizacion = ahora;
        if (disponible == null) disponible = true;
        if (estado == null || estado.isBlank()) estado = "evaluacion";
        if (edadMeses == null) edadMeses = 0;
    }

    @PreUpdate
    public void preUpdate() {
        ultimaActualizacion = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEspecie() { return especie; }
    public void setEspecie(String especie) { this.especie = especie; }

    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }

    public String getRaza() { return raza; }
    public void setRaza(String raza) { this.raza = raza; }

    public Integer getEdadMeses() { return edadMeses; }
    public void setEdadMeses(Integer edadMeses) { this.edadMeses = edadMeses; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getFotoUrl() { return fotoUrl; }
    public void setFotoUrl(String fotoUrl) { this.fotoUrl = fotoUrl; }

    public Boolean getDisponible() { return disponible; }
    public void setDisponible(Boolean disponible) { this.disponible = disponible; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getCondicion() { return condicion; }
    public void setCondicion(String condicion) { this.condicion = condicion; }

    public String getResponsable() { return responsable; }
    public void setResponsable(String responsable) { this.responsable = responsable; }

    public String getLugarRescate() { return lugarRescate; }
    public void setLugarRescate(String lugarRescate) { this.lugarRescate = lugarRescate; }

    public LocalDateTime getUltimaActualizacion() { return ultimaActualizacion; }
    public void setUltimaActualizacion(LocalDateTime ultimaActualizacion) { this.ultimaActualizacion = ultimaActualizacion; }

    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
}
