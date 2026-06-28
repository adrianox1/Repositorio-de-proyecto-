/**
 * WAU Piura - Scripts Globales y Utilidades
 * Compartido en todas las vistas de la plataforma.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initNavbarAuth();
  initPasswordToggle();
  initImagePreview();
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
        const linksUsuario = esAdmin
          ? `<a href="admin.html" class="nav-link-user">Panel admin</a>`
          : `<a href="mascotas.html" class="nav-link-user">Mis Mascotas</a>
             <span class="nav-sep">·</span>
             <a href="mis-solicitudes.html" class="nav-link-user">Mis Solicitudes</a>`;

        const authHTML = `
          <div class="nav-usuario">
            <span class="nav-usuario-saludo">👤 <strong>${escapeHTML(data.usuario.nombre)}</strong></span>
            <div class="nav-usuario-links">${linksUsuario}</div>
          </div>
          <a href="#" class="btn-secondary nav-btn-sm btn-logout">Salir</a>
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
// VISTA PREVIA DE IMAGEN
// Aplica automáticamente a todo input[type="file"][accept="image/*"].
// También expone mostrarPreviewImagen(input, src) para cargar la foto
// actual cuando se edita una mascota que ya tiene foto guardada.
// ==========================================
function initImagePreview() {
  document.querySelectorAll('input[type="file"][accept="image/*"]').forEach(input => {
    const wrap = _crearPreviewWrap(input);

    // Nueva selección de archivo → mostrar preview
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => _mostrarPreview(wrap, e.target.result, file.name);
        reader.readAsDataURL(file);
      } else {
        _ocultarPreview(wrap);
      }
    });

    // Botón "Quitar": limpia el input y oculta el preview
    wrap.querySelector('.img-preview-quitar').addEventListener('click', () => {
      input.value = '';
      _ocultarPreview(wrap);
    });

    // Reset del formulario → ocultar preview
    const form = input.closest('form');
    if (form) {
      form.addEventListener('reset', () => _ocultarPreview(wrap));
    }
  });
}

function _crearPreviewWrap(input) {
  const wrap = document.createElement('div');
  wrap.className = 'img-preview-wrap';
  wrap.hidden = true;
  wrap.innerHTML = `
    <img class="img-preview" src="" alt="Vista previa de foto">
    <div class="img-preview-info">
      <span class="img-preview-nombre"></span>
      <button type="button" class="img-preview-quitar">✕ Quitar</button>
    </div>
  `;
  input.insertAdjacentElement('afterend', wrap);
  return wrap;
}

function _mostrarPreview(wrap, src, nombre) {
  wrap.querySelector('.img-preview').src = src;
  wrap.querySelector('.img-preview-nombre').textContent = nombre || 'Foto actual';
  wrap.hidden = false;
}

function _ocultarPreview(wrap) {
  wrap.hidden = true;
  wrap.querySelector('.img-preview').src = '';
  wrap.querySelector('.img-preview-nombre').textContent = '';
}

/** Muestra la foto ya guardada en el preview (útil al cargar un formulario de edición). */
function mostrarPreviewImagen(fileInput, src) {
  if (!src || !fileInput) return;
  const wrap = fileInput.parentElement
    ? fileInput.parentElement.querySelector('.img-preview-wrap')
      || fileInput.nextElementSibling
    : null;
  if (wrap && wrap.classList.contains('img-preview-wrap')) {
    _mostrarPreview(wrap, src, 'Foto actual');
  }
}

window.mostrarPreviewImagen = mostrarPreviewImagen;

// ==========================================
// MOSTRAR / OCULTAR CONTRASEÑA (ojito)
// Aplica automáticamente a todo input[type="password"] de la página.
// ==========================================
function initPasswordToggle() {
  const iconoOjo = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`;

  const iconoOjoTachado = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>`;

  document.querySelectorAll('input[type="password"]').forEach(input => {
    const wrapper = document.createElement('div');
    wrapper.className = 'pass-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pass-toggle';
    btn.setAttribute('aria-label', 'Mostrar contraseña');
    btn.innerHTML = iconoOjo;
    wrapper.appendChild(btn);

    btn.addEventListener('click', () => {
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      btn.innerHTML = visible ? iconoOjo : iconoOjoTachado;
      btn.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
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
function toast(mensaje, tipo = 'info', duracion = 4000, centrado = false) {
  if (centrado) {
    toastCentral(mensaje, tipo, duracion);
    return;
  }

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

function toastCentral(mensaje, tipo, duracion = 2500) {
  const iconos = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const overlay = document.createElement('div');
  overlay.className = 'toast-central-overlay';
  overlay.innerHTML = `
    <div class="toast-central-box">
      <div class="toast-central-icono">${iconos[tipo] || 'ℹ️'}</div>
      <div class="toast-central-titulo">${escapeHTML(mensaje)}</div>
    </div>
  `;

  const cerrar = () => {
    overlay.style.transition = 'opacity 0.35s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 350);
  };

  overlay.addEventListener('click', cerrar);
  document.body.appendChild(overlay);
  setTimeout(cerrar, duracion);
}

window.toast = toast;
window.toastCentral = toastCentral;

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

// ==========================================
// HELPER: ESTADO VACÍO EN TABLAS
// Genera HTML para una fila de tabla con icono, título y subtítulo.
// Uso: tabla.innerHTML = tablaVacia('🐾', 'Sin mascotas', 'Crea una arriba.', 7)
// ==========================================
function tablaVacia(icono, titulo, subtitulo, colspan) {
  const sub = subtitulo
    ? `<p class="empty-state-sub">${escapeHTML(subtitulo)}</p>`
    : '';
  return `<tr><td colspan="${colspan}" class="table-empty">
    <div class="empty-state">
      <div class="empty-state-icono">${icono}</div>
      <p class="empty-state-titulo">${escapeHTML(titulo)}</p>
      ${sub}
    </div>
  </td></tr>`;
}

window.tablaVacia = tablaVacia;
