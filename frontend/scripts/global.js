/**
 * WAU Piura - Scripts Globales y Utilidades
 * Compartido en todas las vistas de la plataforma.
 */

document.addEventListener('DOMContentLoaded', () => {
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
// 1. CONTROL DE AUTENTICACIÓN Y NAVBAR
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

        // Usuario logueado: Reemplazar botones de login/registro
        navAuth.innerHTML = `
          <span style="font-weight: 700; color: var(--azul-oscuro); font-size: 0.95rem; white-space: nowrap;">
            👤 Hola, <strong>${escapeHTML(data.usuario.nombre)}</strong>
          </span>
          ${enlaceContextual}
          <a href="#" class="btn-secondary btn-logout" style="padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 800;">
            Cerrar Sesión
          </a>
        `;

        // Evento de cierre de sesión
        const btnLogout = navAuth.querySelector('.btn-logout');
        btnLogout.addEventListener('click', (e) => {
          e.preventDefault();
          fetch('/api/logout', { credentials: 'include' })
            .then(res => res.json())
            .then(logoutData => {
              if (logoutData.ok) {
                window.location.href = 'index.html';
              }
            })
            .catch(err => console.error("Error al cerrar sesión:", err));
        });
      }
    })
    .catch(err => console.error("Error al consultar sesión:", err));
}

// ==========================================
// 2. EFECTOS E INTERFACES DE SCROLL
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
