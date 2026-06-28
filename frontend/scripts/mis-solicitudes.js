/**
 * WAU Piura - Mis Solicitudes de Adopción
 * Específico para mis-solicitudes.html.
 */

function api(url, options = {}) {
  return apiFetch(url, options);
}

document.addEventListener('DOMContentLoaded', () => {
  api('/api/me')
    .then(res => res.json())
    .then(data => {
      if (!data.ok || !data.usuario) {
        toast('Debes iniciar sesión para ver tus solicitudes.', 'warning');
        setTimeout(() => { window.location.href = 'iniciar-sesion.html'; }, 1300);
        return;
      }
      cargarMisSolicitudes();
    })
    .catch(() => {
      window.location.href = 'iniciar-sesion.html';
    });
});

function cargarMisSolicitudes() {
  api('/api/solicitudes/mias')
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        mostrarError(data.error || 'No se pudieron cargar tus solicitudes.');
        return;
      }
      const lista = data.solicitudes || [];
      actualizarStats(lista);
      renderTarjetas(lista);
    })
    .catch(() => mostrarError('Sin conexión con el servidor. Comprueba tu red e intenta recargar la página.'));
}

function actualizarStats(lista) {
  document.getElementById('statTotal').textContent       = lista.length;
  document.getElementById('statPendientes').textContent  = lista.filter(s => s.estado === 'pendiente').length;
  document.getElementById('statAprobadas').textContent   = lista.filter(s => s.estado === 'aprobada').length;
  document.getElementById('statRechazadas').textContent  = lista.filter(s => s.estado === 'rechazada').length;
}

function renderTarjetas(lista) {
  const grid = document.getElementById('misSolicitudesGrid');
  if (!grid) return;

  if (lista.length === 0) {
    grid.innerHTML = `
      <div class="mis-sol-vacio">
        <div class="mis-sol-vacio-icono">🐾</div>
        <h3>Aún no has enviado solicitudes</h3>
        <p>Explora el catálogo y solicita adoptar a la mascota que más te llame.</p>
        <a href="catalogo.html" class="btn-primary" style="margin-top:1rem; display:inline-block;">Ver catálogo</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  lista.forEach(s => {
    const emoji = s.mascota.especie === 'perro' ? '🐶'
                : s.mascota.especie === 'gato'  ? '🐱' : '🐾';

    const estadoLabel = s.estado === 'pendiente' ? '🕐 Pendiente'
                      : s.estado === 'aprobada'  ? '✅ Aprobada'
                      : '❌ Rechazada';

    const mensajeTruncado = s.mensaje.length > 120
      ? s.mensaje.slice(0, 120) + '…'
      : s.mensaje;

    const linkSeguimiento = s.mascota.id
      ? `<a href="seguimiento.html?id=${s.mascota.id}" class="btn-secondary mis-sol-btn">Ver seguimiento</a>`
      : '';

    const card = document.createElement('article');
    card.className = `mis-sol-card mis-sol-${escapeHTML(s.estado)}`;
    card.innerHTML = `
      <div class="mis-sol-header">
        <span class="mis-sol-emoji">${emoji}</span>
        <div class="mis-sol-info">
          <h3>${escapeHTML(s.mascota.nombre)}</h3>
          <p class="mis-sol-meta">Solicitud #${s.id} · ${escapeHTML(s.mascota.especie || '')}</p>
        </div>
        <span class="badge badge-${escapeHTML(s.estado)} mis-sol-badge">${estadoLabel}</span>
      </div>
      <blockquote class="mis-sol-mensaje">"${escapeHTML(mensajeTruncado)}"</blockquote>
      <div class="mis-sol-footer">
        <span class="mis-sol-fecha">📅 ${formatDate((s.creadoEn || '').slice(0, 10))}</span>
        ${linkSeguimiento}
      </div>
    `;
    grid.appendChild(card);
  });
}

function mostrarError(msg) {
  const grid = document.getElementById('misSolicitudesGrid');
  if (grid) grid.innerHTML = `<p style="color:#c0392b; font-weight:700; padding:2rem 0;">${escapeHTML(msg)}</p>`;
}
