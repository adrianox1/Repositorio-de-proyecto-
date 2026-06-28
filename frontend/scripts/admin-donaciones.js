/**
 * Módulo administrativo de donaciones.
 * El administrador puede aprobar o rechazar donaciones pendientes.
 */

function cargarDonacionesPendientes() {
  const tabla = document.getElementById('tablaDonacionesPendientes');
  const contador = document.getElementById('statDonacionesPendientes');
  const total = document.getElementById('statTotalRecaudado');
  if (!tabla || !contador || !total) return;

  api('/api/donaciones?estado=PENDIENTE')
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        tabla.innerHTML = tablaVacia('🔧', 'No se pudieron cargar las donaciones', 'Intenta recargar la página.', 7);
        return;
      }

      const donaciones = data.donaciones || [];
      contador.textContent = donaciones.length;
      renderDonacionesPendientes(donaciones);
      return api('/api/donaciones/total');
    })
    .then(res => res && res.json())
    .then(resultado => {
      if (resultado && resultado.ok) {
        document.getElementById('statTotalRecaudado').textContent = `S/ ${Number(resultado.total || 0).toFixed(2)}`;
      }
    })
    .catch(err => {
      console.error('Error al cargar donaciones:', err);
      if (tabla) tabla.innerHTML = tablaVacia('🔌', 'Sin conexión con el servidor', 'Comprueba el backend e intenta de nuevo.', 7);
    });
}

function renderDonacionesPendientes(donaciones) {
  const tabla = document.getElementById('tablaDonacionesPendientes');
  if (!tabla) return;

  if (donaciones.length === 0) {
    tabla.innerHTML = tablaVacia('🟢', 'No hay donaciones pendientes', 'Cuando lleguen nuevas donaciones las verás aquí.', 7);
    return;
  }

  tabla.innerHTML = '';
  donaciones.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${escapeHTML(d.usuario?.nombre || 'Sin usuario')}</td>
      <td>${Number(d.monto || 0).toFixed(2)}</td>
      <td>${escapeHTML(d.numeroOperacion)}</td>
      <td>${formatDate((d.fechaDonacion || '').slice(0, 10))}</td>
      <td>${d.fotoBoucherUrl ? `<a href="${escapeHTML(d.fotoBoucherUrl)}" target="_blank" rel="noreferrer">Ver boucher</a>` : 'Sin foto'}</td>
      <td>
        <button class="btn-secondary btn-aprobar-d" data-id="${d.id}">Aprobar</button>
        <button class="btn-delete btn-rechazar-d" data-id="${d.id}">Rechazar</button>
      </td>
    `;
    tabla.appendChild(tr);
  });

  tabla.querySelectorAll('.btn-aprobar-d').forEach(btn => {
    btn.addEventListener('click', () => cambiarEstadoDonacion(btn.dataset.id, 'APROBADO'));
  });
  tabla.querySelectorAll('.btn-rechazar-d').forEach(btn => {
    btn.addEventListener('click', () => cambiarEstadoDonacion(btn.dataset.id, 'RECHAZADO'));
  });
}

function cambiarEstadoDonacion(id, estado) {
  const esAprobar = estado === 'APROBADO';
  confirmar({
    titulo: esAprobar ? 'Aprobar donación' : 'Rechazar donación',
    mensaje: esAprobar
      ? 'Confirma que deseas aprobar esta donación y agregarla al total recaudado.'
      : 'Confirma que deseas rechazar esta donación pendiente.',
    textoAceptar: esAprobar ? 'Sí, aprobar' : 'Sí, rechazar',
    variante: esAprobar ? 'ok' : 'peligro'
  }).then(ok => {
    if (!ok) return;
    api(`/api/donaciones/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          toast(esAprobar ? 'Donación aprobada.' : 'Donación rechazada.', 'success');
          cargarDonacionesPendientes();
        } else {
          toast(data.error || 'No se pudo actualizar el estado.', 'error');
        }
      })
      .catch(err => {
        console.error('Error al cambiar estado de la donación:', err);
        toast('No se pudo actualizar el estado. Intenta de nuevo.', 'error');
      });
  });
}
