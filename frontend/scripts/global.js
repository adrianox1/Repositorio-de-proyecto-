/**
 * WAU Piura - Scripts Globales y Utilidades
 * Compartido en todas las vistas de la plataforma.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initNavbarAuth();
  initScrollAnimations();
  initScrollTopButton();
});

// ==========================================
// INTERCEPTOR DE SESIÓN
// Envoltura de fetch para toda la app: si el backend responde 401
// (sesión expirada / no iniciada en una ruta protegida), redirige
// automáticamente al login. El 403 (sin permiso) NO redirige.
// ==========================================
function apiFetch(url, options = {}) {
  return fetch(url, { credentials: 'include', ...options }).then(res => {
    if (res.status === 401 && url.indexOf('/api/') !== -1) {
      // Evita bucles si ya estamos en la página de login
      if (!window.location.pathname.endsWith('iniciar-sesion.html')) {
        window.location.href = 'iniciar-sesion.html?expirado=1';
      }
      return Promise.reject(new Error('Sesión expirada'));
    }
    return res;
  });
}
// Disponible globalmente para los demás scripts
window.apiFetch = apiFetch;

// ==========================================
// VALIDACIÓN DE FORMULARIOS (cliente)
// Utilidades compartidas por todos los formularios de la app.
// ==========================================
const Validar = {
  requerido: (v) => v != null && String(v).trim() !== '',
  email:     (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()),
  telefono:  (v) => /^[0-9+\-\s()]{6,20}$/.test(String(v).trim()),
  min:       (v, n) => String(v).trim().length >= n,
  noNegativo:(v) => v === '' || v == null || (!isNaN(Number(v)) && Number(v) >= 0),
  url:       (v) => { try { new URL(String(v).trim()); return true; } catch (e) { return false; } }
};

/** Quita marcas de error previas del formulario. */
function limpiarValidacion(form) {
  form.querySelectorAll('.campo-invalido').forEach(el => el.classList.remove('campo-invalido'));
  const cont = form.querySelector('.form-errores');
  if (cont) { cont.innerHTML = ''; cont.style.display = 'none'; }
}

/** Muestra una lista de errores arriba del formulario y marca los campos. */
function mostrarErrores(form, errores) {
  let cont = form.querySelector('.form-errores');
  if (!cont) {
    cont = document.createElement('div');
    cont.className = 'form-errores';
    form.insertBefore(cont, form.firstChild);
  }
  cont.innerHTML = errores.map(e => `• ${escapeHTML(e.mensaje)}`).join('<br>');
  cont.style.display = 'block';
  errores.forEach(e => { if (e.input) e.input.classList.add('campo-invalido'); });
  cont.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Al corregir un campo, quita su borde rojo automáticamente
document.addEventListener('input', (e) => {
  if (e.target.classList && e.target.classList.contains('campo-invalido')) {
    e.target.classList.remove('campo-invalido');
  }
});

// ==========================================
// 1. MENÚ HAMBURGUESA (móvil)
// ==========================================
function initHamburger() {
  const header = document.querySelector('header');
  const navbar = header ? header.querySelector('.navbar') : null;
  if (!navbar) return;

  // Botón hamburguesa
  const btn = document.createElement('button');
  btn.className = 'hamburger-btn';
  btn.setAttribute('aria-label', 'Abrir menú');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '☰';
  navbar.appendChild(btn);

  // Panel móvil
  const panel = document.createElement('nav');
  panel.className = 'nav-mobile';
  panel.id = 'nav-mobile';

  // Clonar enlaces de navegación
  const navEl = navbar.querySelector('nav');
  if (navEl) {
    const linksDiv = document.createElement('div');
    linksDiv.className = 'nav-mobile-links';
    navEl.querySelectorAll('a').forEach(a => {
      const clone = a.cloneNode(true);
      linksDiv.appendChild(clone);
    });
    panel.appendChild(linksDiv);
  }

  // Sección de auth (se sincroniza después)
  const authDiv = document.createElement('div');
  authDiv.className = 'nav-mobile-auth';
  authDiv.innerHTML = `
    <a href="iniciar-sesion.html" class="btn-login" style="text-align:center">Iniciar Sesión</a>
    <a href="registro.html" class="btn-register" style="text-align:center;display:block">Registrarse</a>
  `;
  panel.appendChild(authDiv);
  header.appendChild(panel);

  // Toggle abrir/cerrar
  btn.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    btn.innerHTML = isOpen ? '✕' : '☰';
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  // Cerrar al tocar un enlace
  panel.addEventListener('click', e => {
    if (e.target.tagName === 'A') {
      panel.classList.remove('open');
      btn.innerHTML = '☰';
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

// ==========================================
// 2. CONTROL DE AUTENTICACIÓN Y NAVBAR
// ==========================================
function initNavbarAuth() {
  const navAuth = document.querySelector('.nav-auth');
  if (!navAuth) return;

  // Consultar sesión activa en el backend Java
  fetch('/api/me', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.ok && data.usuario) {
        // El admin gestiona todo desde el panel; el usuario normal ve "Mis Mascotas"
        const esAdmin = data.usuario.rol === 'ADMIN';
        const enlaceContextual = esAdmin
          ? `<a href="admin.html" class="btn-secondary" style="padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 800;">Panel admin</a>`
          : `<a href="mascotas.html" class="btn-secondary" style="padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 800;">Mis Mascotas</a>`;

        const authHTML = `
          <span style="font-weight: 700; color: var(--azul-oscuro); font-size: 0.95rem; white-space: nowrap;">
            👤 Hola, <strong>${escapeHTML(data.usuario.nombre)}</strong>
          </span>
          ${enlaceContextual}
          <a href="#" class="btn-secondary btn-logout" style="padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 800;">
            Cerrar Sesión
          </a>
        `;

        navAuth.innerHTML = authHTML;

        // Sincronizar con panel móvil
        const mobileAuth = document.querySelector('.nav-mobile-auth');
        if (mobileAuth) mobileAuth.innerHTML = authHTML;

        // Evento de cierre de sesión (desktop y móvil)
        document.querySelectorAll('.btn-logout').forEach(btnLogout => {
          btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            fetch('/api/logout', { credentials: 'include' })
              .then(res => res.json())
              .then(logoutData => {
                if (logoutData.ok) window.location.href = 'index.html';
              })
              .catch(err => console.error("Error al cerrar sesión:", err));
          });
        });
      }
    })
    .catch(err => console.error("Error al consultar sesión:", err));
}

// ==========================================
// 3. EFECTOS E INTERFACES DE SCROLL
// ==========================================
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animateElements = document.querySelectorAll('.workflow-step, .support-card, .testimonial-card, .pet-card, .tracking-summary, .timeline-card, .info-card, .notes-card, .urgent-card');
  
  animateElements.forEach((el, index) => {
    el.classList.add('fade-in-section');
    el.style.transitionDelay = `${(index % 3) * 0.1}s`;
    observer.observe(el);
  });
}

function initScrollTopButton() {
  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.innerHTML = '↑';
  scrollTopBtn.className = 'scroll-top-btn';
  scrollTopBtn.setAttribute('aria-label', 'Volver arriba');
  document.body.appendChild(scrollTopBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==========================================
// UTILERÍAS COMPLEMENTARIAS COMPARTIDAS
// ==========================================
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatDate(dateStr) {
  if (!dateStr) return 'No registrada';
  try {
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch(e) {
    return dateStr;
  }
}

function getStatusBadgeClass(status) {
  switch(status) {
    case 'evaluacion': return 'status-review';
    case 'tratamiento': return 'status-treatment';
    case 'recuperacion': return 'status-recovery';
    case 'disponible': return 'status-available';
    default: return 'status-review';
  }
}

function getStatusText(status) {
  switch(status) {
    case 'evaluacion': return 'En evaluación';
    case 'tratamiento': return 'En tratamiento';
    case 'recuperacion': return 'En recuperación';
    case 'disponible': return 'Disponible';
    default: return status;
  }
}

// ==========================================
// SISTEMA DE NOTIFICACIONES TOAST
// Reemplaza los alert() nativos del navegador.
// Uso: toast('Mensaje', 'success' | 'error' | 'warning' | 'info')
// ==========================================
function toast(mensaje, tipo = 'info', duracion = 4000) {
  let contenedor = document.getElementById('toast-container');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'toast-container';
    document.body.appendChild(contenedor);
  }

  const iconos = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.innerHTML = `
    <span class="toast-icono">${iconos[tipo] || 'ℹ️'}</span>
    <span class="toast-texto">${escapeHTML(mensaje)}</span>
    <button class="toast-cerrar" aria-label="Cerrar">✕</button>
  `;

  const cerrar = () => {
    el.classList.add('saliendo');
    setTimeout(() => el.remove(), 400);
  };

  el.querySelector('.toast-cerrar').addEventListener('click', cerrar);
  contenedor.appendChild(el);
  setTimeout(cerrar, duracion);
}

window.toast = toast;

// ==========================================
// MODAL DE CONFIRMACIÓN
// Reemplaza el confirm() nativo del navegador.
// Uso: confirmar({ titulo, mensaje, textoAceptar, variante })
//   .then(ok => { if (ok) { /* acción */ } })
// variante: 'peligro' (rojo, default) | 'ok' (verde)
// ==========================================
function confirmar({ titulo = '¿Estás seguro?', mensaje = '', textoAceptar = 'Confirmar', variante = 'peligro' } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true">
        <div class="confirm-icono">${variante === 'peligro' ? '🗑️' : '✅'}</div>
        <div class="confirm-titulo">${escapeHTML(titulo)}</div>
        ${mensaje ? `<div class="confirm-mensaje">${escapeHTML(mensaje)}</div>` : ''}
        <div class="confirm-acciones">
          <button class="confirm-btn-cancelar">Cancelar</button>
          <button class="confirm-btn-aceptar ${variante === 'ok' ? 'verde' : ''}">${escapeHTML(textoAceptar)}</button>
        </div>
      </div>
    `;

    const cerrar = (resultado) => {
      overlay.remove();
      resolve(resultado);
    };

    overlay.querySelector('.confirm-btn-cancelar').addEventListener('click', () => cerrar(false));
    overlay.querySelector('.confirm-btn-aceptar').addEventListener('click', () => cerrar(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(false); });

    document.body.appendChild(overlay);
    overlay.querySelector('.confirm-btn-aceptar').focus();
  });
}

window.confirmar = confirmar;
