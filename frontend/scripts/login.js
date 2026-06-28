/**
 * WAU Piura - Formulario de Inicio de Sesión
 * Específico para iniciar-sesion.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Aviso si el usuario llegó aquí porque su sesión expiró
  const params = new URLSearchParams(window.location.search);
  if (params.get('expirado') === '1') {
    const card = document.querySelector('.auth-card');
    if (card) {
      const aviso = document.createElement('p');
      aviso.textContent = 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.';
      aviso.style.cssText = 'background:#fdecc8; color:#9a6400; padding:0.75rem 1rem; border-radius:12px; font-size:0.9rem; font-weight:700; margin-bottom:1rem;';
      const form = card.querySelector('.auth-form');
      card.insertBefore(aviso, form);
    }
  }

  const loginForm = document.querySelector('.auth-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = loginForm.querySelector('input[type="email"]');
      const passInput = loginForm.querySelector('input[type="password"]');

      if (!emailInput || !passInput) return;

      const correo = emailInput.value.trim();
      const contrasena = passInput.value;

      limpiarValidacion(loginForm);
      const errores = [];
      if (!Validar.requerido(correo)) {
        errores.push({ input: emailInput, mensaje: 'El correo es obligatorio.' });
      } else if (!Validar.email(correo)) {
        errores.push({ input: emailInput, mensaje: 'El correo no tiene un formato válido.' });
      }
      if (!Validar.requerido(contrasena)) {
        errores.push({ input: passInput, mensaje: 'La contraseña es obligatoria.' });
      }
      if (errores.length > 0) {
        mostrarErrores(loginForm, errores);
        return;
      }

      fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: correo,
          contrasena: contrasena
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          sessionStorage.setItem('usuarioId', String(data.usuario.id));
          toast(`¡Bienvenido(a), ${data.usuario.nombre}!`, 'success', 2500, true);
          const destino = data.usuario.rol === 'ADMIN' ? 'admin.html' : 'index.html';
          setTimeout(() => { window.location.href = destino; }, 1400);
        } else {
          console.error("Error de credenciales al iniciar sesión:", data.error);
          toast('Correo o contraseña incorrectos.', 'error');
        }
      })
      .catch(err => {
        console.error("Error técnico al ingresar:", err);
        toast('Correo o contraseña incorrectos.', 'error');
      });
    });
  }
});
