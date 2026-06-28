/**
 * WAU Piura - Formulario de Registro de Usuarios
 * Específico para registro.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.querySelector('.auth-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = registerForm.querySelector('input[placeholder*="Nombre"]');
      const emailInput = registerForm.querySelector('input[placeholder*="Correo"]');
      const phoneInput = registerForm.querySelector('input[placeholder*="Teléfono"]');
      const addressInput = registerForm.querySelector('input[placeholder*="Dirección"]');
      const passInput = registerForm.querySelector('input[placeholder*="Contraseña"]:not([placeholder*="Confirmar"])');
      const confirmPassInput = registerForm.querySelector('input[placeholder*="Confirmar"]');

      const nombre = nameInput ? nameInput.value.trim() : '';
      const correo = emailInput ? emailInput.value.trim() : '';
      const telefono = phoneInput ? phoneInput.value.trim() : '';
      const direccion = addressInput ? addressInput.value.trim() : '';
      const contrasena = passInput ? passInput.value : '';

      // Validaciones del cliente
      limpiarValidacion(registerForm);
      const errores = [];

      if (!Validar.requerido(nombre)) {
        errores.push({ input: nameInput, mensaje: 'El nombre es obligatorio.' });
      } else if (!Validar.min(nombre, 2)) {
        errores.push({ input: nameInput, mensaje: 'El nombre es demasiado corto.' });
      }

      if (!Validar.requerido(correo)) {
        errores.push({ input: emailInput, mensaje: 'El correo es obligatorio.' });
      } else if (!Validar.email(correo)) {
        errores.push({ input: emailInput, mensaje: 'El correo no tiene un formato válido.' });
      }

      if (!Validar.requerido(telefono)) {
        errores.push({ input: phoneInput, mensaje: 'El teléfono es obligatorio.' });
      } else if (!Validar.telefono(telefono)) {
        errores.push({ input: phoneInput, mensaje: 'El teléfono debe tener entre 6 y 20 dígitos.' });
      }

      if (!Validar.requerido(direccion)) {
        errores.push({ input: addressInput, mensaje: 'La dirección es obligatoria.' });
      }

      if (!Validar.requerido(contrasena)) {
        errores.push({ input: passInput, mensaje: 'La contraseña es obligatoria.' });
      } else if (!Validar.min(contrasena, 6)) {
        errores.push({ input: passInput, mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
      }

      if (confirmPassInput) {
        if (!Validar.requerido(confirmPassInput.value)) {
          errores.push({ input: confirmPassInput, mensaje: 'Confirma tu contraseña.' });
        } else if (confirmPassInput.value !== contrasena) {
          errores.push({ input: confirmPassInput, mensaje: 'Las contraseñas no coinciden.' });
        }
      }

      if (errores.length > 0) {
        mostrarErrores(registerForm, errores);
        return;
      }

      fetch('/api/registro', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          correo: correo,
          telefono: telefono,
          direccion: direccion,
          contrasena: contrasena
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          toast('¡Cuenta creada! Ahora inicia sesión.', 'success');
          setTimeout(() => { window.location.href = 'iniciar-sesion.html'; }, 1500);
        } else {
          console.error("Fallo de validación en backend al registrarse:", data.error);
          toast(data.error || 'No se pudo registrar el usuario. Verifica los datos ingresados.', 'error');
        }
      })
      .catch(err => {
        console.error("Error técnico al registrarse:", err);
        toast('No se pudo registrar el usuario. Verifica los datos ingresados.', 'error');
      });
    });
  }
});
