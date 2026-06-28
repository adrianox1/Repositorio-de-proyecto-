/**
 * WAU Piura - Catálogo de Mascotas y Solicitudes de Adopción
 * Específico para catalogo.html. Consume el backend Java (/api).
 */

// Usa el interceptor de sesión global (redirige a login si la sesión expira)
function api(url, options = {}) {
  return apiFetch(url, options);
}

document.addEventListener('DOMContentLoaded', () => {
  initCatalog();
});

// ==========================================
// 1. CATÁLOGO DINÁMICO
// ==========================================
function initCatalog() {
  const petGrid = document.querySelector('.pet-grid');
  if (!petGrid) return; // No estamos en la página del catálogo

  const searchInput = document.getElementById('pet-search');
  const visibleCountEl = document.getElementById('visible-count');
  const noResultsEl = document.getElementById('no-results');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let allPets = [];
  let currentFilter = 'todos';
  let searchTerm = '';

  // 1.1 Cargar las mascotas desde /api/mascotas
  api('/api/mascotas')
    .then(res => res.json())
    .then(data => {
      if (data.ok && Array.isArray(data.mascotas)) {
        allPets = data.mascotas;
        renderCatalog();
        updateCounters();
      } else {
        throw new Error(data.error || 'Respuesta del servidor no válida');
      }
    })
    .catch(err => {
      console.error('Error al cargar las mascotas:', err);
      if (visibleCountEl) visibleCountEl.textContent = '0';
      petGrid.innerHTML = `
        <div class="no-results" style="grid-column: 1/-1; padding: 3rem 2rem; border: 2px dashed #FECDCA; background: #FEF3F2; border-radius: 16px; text-align: center;">
          <h3 style="color: #B42318; margin-bottom: 0.8rem; font-weight: 800; font-size: 1.3rem;">
            🐾 Error al cargar las mascotas
          </h3>
          <p style="color: #667085; font-size: 0.95rem; line-height: 1.6; max-width: 650px; margin: 0 auto; font-weight: 500;">
            No se pudieron cargar las mascotas. Verifica que el servidor esté activo.
          </p>
          <small style="display: block; margin-top: 1rem; color: #98A2B3; font-style: italic;">
            Detalle técnico: ${escapeHTML(err.message)}
          </small>
        </div>
      `;
    });

  // 1.2 Renderizado dinámico de tarjetas
  const renderCatalog = () => {
    petGrid.innerHTML = '';
    let visibleCards = 0;

    allPets.forEach(pet => {
      const matchesFilter = (currentFilter === 'todos') || (pet.estado === currentFilter);
      const textToSearch = `${pet.nombre} ${pet.raza} ${pet.especie} ${pet.descripcion} ${pet.condicion}`.toLowerCase();
      const matchesSearch = textToSearch.includes(searchTerm);

      if (matchesFilter && matchesSearch) {
        visibleCards++;

        const card = document.createElement('article');
        card.className = 'pet-card';
        card.setAttribute('data-status', pet.estado);

        const petEmoji = pet.especie === 'perro' ? '🐶' : (pet.especie === 'gato' ? '🐱' : '🐾');
        const bgClass = pet.especie === 'perro' ? 'pet-dog' : 'pet-cat';

        card.innerHTML = `
          <div class="pet-image ${bgClass}">
            ${pet.fotoUrl ? `<img src="${escapeHTML(pet.fotoUrl)}" alt="${escapeHTML(pet.nombre)}" style="width:100%; height:100%; object-fit:cover;">` : petEmoji}
          </div>
          <div class="pet-content">
            <div class="pet-header">
              <h3>${escapeHTML(pet.nombre)}</h3>
              <span class="status-badge ${getStatusBadgeClass(pet.estado)}">${getStatusText(pet.estado)}</span>
            </div>
            <p class="pet-meta">${escapeHTML(pet.raza || 'Sin raza')} · ${pet.edadMeses} meses · ${pet.genero === 'macho' ? 'Macho' : 'Hembra'}</p>
            <p style="color: #64748B; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem;">
              ${escapeHTML(pet.descripcion || '')}
            </p>
            <ul class="pet-details">
              <li><strong>Condición:</strong> ${escapeHTML(pet.condicion || 'Saludable')}</li>
              <li><strong>Responsable:</strong> ${escapeHTML(pet.responsable || 'Equipo WauPiura')}</li>
              <li><strong>Rescatado en:</strong> ${escapeHTML(pet.lugarRescate || 'Región Piura')}</li>
            </ul>
            <div class="pet-actions">
              <a href="seguimiento.html?id=${pet.id}" class="btn-primary">Ver seguimiento</a>
              ${pet.estado === 'disponible'
                ? `<button class="btn-secondary btn-adopt-trigger" data-id="${pet.id}" data-name="${escapeHTML(pet.nombre)}">Adoptar</button>`
                : `<button class="btn-secondary btn-help-trigger" data-id="${pet.id}" data-name="${escapeHTML(pet.nombre)}">Quiero ayudar</button>`
              }
            </div>
          </div>
        `;
        petGrid.appendChild(card);
      }
    });

    if (visibleCountEl) visibleCountEl.textContent = visibleCards;
    if (noResultsEl) {
      noResultsEl.style.display = (visibleCards === 0) ? 'block' : 'none';
    }

    initAdoptionTriggers();
  };

  // 1.3 Contadores del toolbar
  const updateCounters = () => {
    const counts = { todos: allPets.length, evaluacion: 0, tratamiento: 0, recuperacion: 0, disponible: 0 };
    allPets.forEach(pet => {
      if (counts[pet.estado] !== undefined) counts[pet.estado]++;
    });
    Object.keys(counts).forEach(key => {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = counts[key];
    });
  };

  // 1.4 Filtros
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
      currentFilter = btn.getAttribute('data-filter');
      renderCatalog();
    });
  });

  // 1.5 Búsqueda
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase();
      renderCatalog();
    });
  }
}

// ==========================================
// 2. SOLICITUD DE ADOPCIÓN (MODAL)
// ==========================================
function initAdoptionTriggers() {
  document.querySelectorAll('.btn-adopt-trigger, .btn-help-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      procesarSolicitud(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
    });
  });
}

function procesarSolicitud(petId, petName) {
  // Validar sesión activa antes de abrir el modal
  api('/api/me')
    .then(res => res.json())
    .then(data => {
      if (!data.ok || !data.usuario) {
        toast('Debes iniciar sesión para solicitar una adopción.', 'warning');
        setTimeout(() => { window.location.href = 'iniciar-sesion.html'; }, 1500);
        return;
      }
      abrirModal(petId, petName);
    })
    .catch(() => {
      toast('No se pudo verificar tu sesión. Inicia sesión nuevamente.', 'error');
      setTimeout(() => { window.location.href = 'iniciar-sesion.html'; }, 1500);
    });
}

function abrirModal(petId, petName) {
  const modal = document.getElementById('adoption-modal');
  if (!modal) return;

  document.getElementById('modal-pet-name').textContent = petName;
  document.getElementById('modal-pet-id').value = petId;
  document.getElementById('modal-message').value = '';
  modal.style.display = 'flex';

  document.getElementById('modal-cancel-btn').onclick = () => { modal.style.display = 'none'; };
  modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  document.getElementById('modal-adoption-form').onsubmit = (e) => {
    e.preventDefault();
    const modalForm = document.getElementById('modal-adoption-form');
    const textarea = document.getElementById('modal-message');
    const mensaje = textarea.value.trim();

    limpiarValidacion(modalForm);
    const errores = [];
    if (!Validar.requerido(mensaje)) {
      errores.push({ input: textarea, mensaje: 'El mensaje de motivación es obligatorio.' });
    } else if (!Validar.min(mensaje, 10)) {
      errores.push({ input: textarea, mensaje: 'Cuéntanos un poco más (mínimo 10 caracteres).' });
    }
    if (errores.length > 0) {
      mostrarErrores(modalForm, errores);
      return;
    }

    api('/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mascotaId: parseInt(petId), mensaje: mensaje })
    })
      .then(res => res.json())
      .then(result => {
        if (result.ok) {
          toast(`¡Solicitud enviada para ${petName}! Nuestro equipo revisará tu caso.`, 'success');
          modal.style.display = 'none';
        } else {
          toast(result.error || 'No se pudo enviar la solicitud.', 'error');
        }
      })
      .catch(err => {
        console.error('Error al enviar la solicitud:', err);
        toast('Ocurrió un error de conexión al enviar la solicitud.', 'error');
      });
  };
}
