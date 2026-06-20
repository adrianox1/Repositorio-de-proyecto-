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

      if (!correo || !contrasena) {
        alert("Completa todos los campos.");
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
          alert(`¡Ingreso correcto! Bienvenido(a) ${data.usuario.nombre}.`);
          // Los administradores van directo al panel de gestión
          window.location.href = data.usuario.rol === 'ADMIN' ? 'admin.html' : 'index.html';
        } else {
          console.error("Error de credenciales al iniciar sesión:", data.error);
          alert("Correo o contraseña incorrectos.");
        }
      })
      .catch(err => {
        console.error("Error técnico al ingresar:", err);
        alert("Correo o contraseña incorrectos.");
      });
    });
  }
});
