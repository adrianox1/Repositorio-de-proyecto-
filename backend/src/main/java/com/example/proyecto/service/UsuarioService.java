package com.example.proyecto.service;

import com.example.proyecto.model.Usuario;
import java.util.List;
import java.util.Optional;

public interface UsuarioService {
    Usuario registrarUsuario(Usuario usuario);
    Optional<Usuario> buscarPorEmail(String email);
    boolean validarCredenciales(String email, String password);
    Optional<Usuario> obtenerUsuarioById(Long id);
    List<Usuario> obtenerTodosUsuarios();
    Usuario actualizarPerfil(Long id, Usuario usuario);
    void eliminarUsuario(Long id);
    boolean existeEmail(String email);
}
