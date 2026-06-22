package com.example.proyecto.service;

import com.example.proyecto.model.Usuario;
import com.example.proyecto.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public Usuario registrarUsuario(Usuario usuario) {
        // La contraseña se guarda siempre cifrada con BCrypt
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        return usuarioRepository.save(usuario);
    }

    @Override
    public Optional<Usuario> buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }

    @Override
    public boolean validarCredenciales(String email, String password) {
        Optional<Usuario> usuario = usuarioRepository.findByEmail(email);
        if (usuario.isEmpty()) {
            return false;
        }
        Usuario u = usuario.get();
        String almacenada = u.getPassword();
        if (almacenada == null) {
            return false;
        }

        // Si ya es un hash BCrypt, comparamos con el encoder
        if (almacenada.startsWith("$2a$") || almacenada.startsWith("$2b$") || almacenada.startsWith("$2y$")) {
            return passwordEncoder.matches(password, almacenada);
        }

        // Contraseña heredada en texto plano (datos viejos / seed):
        // si coincide, la migramos automáticamente a BCrypt.
        if (almacenada.equals(password)) {
            u.setPassword(passwordEncoder.encode(password));
            usuarioRepository.save(u);
            return true;
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
