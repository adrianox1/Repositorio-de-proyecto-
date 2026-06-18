package com.example.proyecto.service;

import com.example.proyecto.model.Usuario;
import com.example.proyecto.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioServiceImpl implements UsuarioService {
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Override
    public Usuario registrarUsuario(Usuario usuario) {
        // En un proyecto real, aquí encriptarías la contraseña
        // usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }
    
    @Override
    public Optional<Usuario> buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }
    
    @Override
    public boolean validarCredenciales(String email, String password) {
        Optional<Usuario> usuario = usuarioRepository.findByEmail(email);
        if (usuario.isPresent()) {
            // En un proyecto real, aquí compararías las contraseñas encriptadas
            // return passwordEncoder.matches(password, usuario.get().getPassword());
            return usuario.get().getPassword().equals(password);
        }
        return false;
    }
    
    @Override
    public Optional<Usuario> obtenerUsuarioById(Long id) {
        return usuarioRepository.findById(id);
    }
    
    @Override
    public List<Usuario> obtenerTodosUsuarios() {
        return usuarioRepository.findAll();
    }
    
    @Override
    public Usuario actualizarPerfil(Long id, Usuario usuarioActualizado) {
        Optional<Usuario> usuarioExistente = usuarioRepository.findById(id);
        if (usuarioExistente.isPresent()) {
            Usuario usuario = usuarioExistente.get();
            usuario.setNombre(usuarioActualizado.getNombre());
            usuario.setTelefono(usuarioActualizado.getTelefono());
            usuario.setDireccion(usuarioActualizado.getDireccion());
            return usuarioRepository.save(usuario);
        }
        return null;
    }
    
    @Override
    public void eliminarUsuario(Long id) {
        usuarioRepository.deleteById(id);
    }
    
    @Override
    public boolean existeEmail(String email) {
        return usuarioRepository.existsByEmail(email);
    }
}
