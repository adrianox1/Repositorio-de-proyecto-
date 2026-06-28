/**
 * WAU Piura - Módulo de Seguimiento Clínico y Social
 * Específico para seguimiento.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTracking();
});

// ==========================================
// 1. MÓDULO DE SEGUIMIENTO DINÁMICO
// ==========================================
function initTracking() {
  const stepper = document.querySelector('.progress-stepper');
  if (!stepper) return; // No estamos en la página de seguimiento

  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get('id');

  if (!petId) {
    toast('ID de mascota no especificado. Redirigiendo al catálogo.', 'warning');
    setTimeout(() => { window.location.href = 'catalogo.html'; }, 1500);
    return;
  }

  const petAvatar = document.querySelector('.pet-avatar');
  const petNameEl = document.querySelector('.tracking-summary h2');
  const petMetaEl = document.querySelector('.tracking-summary p');
  const badgeContainer = document.querySelector('.tracking-summary');
  
  const generalList = document.querySelector('.info-card:nth-of-type(1) .info-list');
  const healthList = document.querySelector('.info-card:nth-of-type(2) .info-list');
  const timelineContainer = document.querySelector('.timeline');
  const notesContainer = document.querySelector('.notes-card p');

  // Cargar la mascota y su historial desde el backend Java
  fetch(`/api/mascotas/${petId}`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (!data.ok || !data.mascota) {
        throw new Error(data.error || 'Mascota no encontrada');
      }
      const pet = data.mascota;

      // 1.1 Actualizar Tarjeta Resumen
      if (petAvatar) {
        petAvatar.textContent = pet.especie === 'perro' ? '🐶' : '🐱';
        petAvatar.className = `pet-avatar ${pet.especie === 'perro' ? 'pet-dog' : 'pet-cat'}`;
        if (pet.fotoUrl) {
          petAvatar.innerHTML = `<img src="${escapeHTML(pet.fotoUrl)}" alt="${escapeHTML(pet.nombre)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
      }
      if (petNameEl) petNameEl.textContent = pet.nombre;
      if (petMetaEl) {
        petMetaEl.textContent = `${escapeHTML(pet.raza || 'Sin raza')} · ${pet.genero === 'macho' ? 'Macho' : 'Hembra'} · ${pet.edadMeses} meses aprox.`;
      }

      // Distintivo de Estado
      const oldBadge = badgeContainer.querySelector('.status-badge');
      if (oldBadge) oldBadge.remove();
      const badge = document.createElement('span');
      badge.className = `status-badge ${getStatusBadgeClass(pet.estado)}`;
      badge.textContent = getStatusText(pet.estado);
      badgeContainer.appendChild(badge);

      // 1.2 Datos Generales
      if (generalList) {
        generalList.innerHTML = `
          <li><strong>Fecha de Registro:</strong> ${formatDate((pet.creadoEn || '').slice(0, 10))}</li>
          <li><strong>Lugar de Rescate:</strong> ${escapeHTML(pet.lugarRescate || 'Región Piura')}</li>
          <li><strong>Responsable:</strong> ${escapeHTML(pet.responsable || 'Equipo WauPiura')}</li>
          <li><strong>Estado Actual:</strong> ${getStatusText(pet.estado)}</li>
        `;
      }

      // 1.3 Condición de Salud
      if (healthList) {
        healthList.innerHTML = `
          <li><strong>Diagnóstico de Entrada:</strong> ${escapeHTML(pet.condicion || 'En evaluación inicial')}</li>
          <li><strong>Esterilización:</strong> Conforme con protocolo</li>
          <li><strong>Vacunas:</strong> Registradas en expediente</li>
          <li><strong>Control de conducta:</strong> Apto para convivencia familiar</li>
        `;
      }

      // 1.4 Observaciones
      if (notesContainer) {
        notesContainer.textContent = pet.descripcion || "No se registran notas adicionales para esta mascota.";
      }

      // 1.5 Stepper de Progreso
      updateStepper(pet.estado);

      // 1.6 Historial de hitos (segunda llamada)
      return fetch(`/api/seguimientos/mascota/${petId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(seg => {
          const history = (seg.ok && seg.seguimientos) ? seg.seguimientos : [];
          if (!timelineContainer) return;

          timelineContainer.innerHTML = '';
          if (history.length === 0) {
            timelineContainer.innerHTML = `
              <div class="timeline-item active">
                <span class="timeline-dot"></span>
                <div>
                  <h4>Ingreso al Refugio</h4>
                  <p>Se inicializó el caso en base de datos. Pendiente de hitos clínicos adicionales.</p>
                  <small>${formatDate((pet.creadoEn || '').slice(0, 10))}</small>
                </div>
              </div>
            `;
          } else {
            history.forEach((h, index) => {
              const hCard = document.createElement('div');
              const statusClass = index === 0 ? 'active' : 'completed';
              hCard.className = `timeline-item ${statusClass}`;
              hCard.innerHTML = `
                <span class="timeline-dot"></span>
                <div>
                  <h4>${escapeHTML(h.titulo)}</h4>
                  <p>${escapeHTML(h.descripcion)}</p>
                  <span class="status-badge ${getStatusBadgeClass(h.estado)}" style="font-size:0.7rem; padding:0.1rem 0.5rem; margin-top:0.25rem;">
                    ${getStatusText(h.estado)}
                  </span>
                  <br>
                  <small>${formatDate((h.fecha || '').slice(0, 10))}</small>
                </div>
              `;
              timelineContainer.appendChild(hCard);
            });
          }
        });
    })
    .catch(err => {
      console.error("Error técnico al cargar seguimiento clínico:", err);
      toast('No se pudo cargar el seguimiento de esta mascota.', 'error');
      setTimeout(() => { window.location.href = 'catalogo.html'; }, 1500);
    });
}

// ==========================================
// 2. CONTROL DE STEPPER POR ÍNDICES
// ==========================================
function updateStepper(estado) {
  const normalized = (estado || '').trim().toLowerCase();
  
  const steps = document.querySelectorAll('.progress-stepper .step');
  const lines = document.querySelectorAll('.progress-stepper .step-line');
  
  if (steps.length < 5 || lines.length < 4) return; // Validación de estructura básica

  // Limpiar clases previas de todos los pasos y líneas divisorias
  steps.forEach(step => step.classList.remove('active', 'completed'));
  lines.forEach(line => line.classList.remove('completed'));

  // Identificar los elementos por su índice exacto
  const stepRescate = steps[0];
  const lineRescateAEval = lines[0];
  
  const stepEvaluacion = steps[1];
  const lineEvalATrat = lines[1];
  
  const stepTratamiento = steps[2];
  const lineTratARecup = lines[2];
  
  const stepRecuperacion = steps[3];
  const lineRecupADisp = lines[3];
  
  const stepDisponible = steps[4];

  // Rescate es el hito de entrada al refugio, siempre está completado
  stepRescate.classList.add('completed');
  lineRescateAEval.classList.add('completed');

  switch(normalized) {
    case 'evaluacion':
      stepEvaluacion.classList.add('active');
      break;
      
    case 'tratamiento':
      stepEvaluacion.classList.add('completed');
      lineEvalATrat.classList.add('completed');
      stepTratamiento.classList.add('active');
      break;
      
    case 'recuperacion':
      stepEvaluacion.classList.add('completed');
      lineEvalATrat.classList.add('completed');
      stepTratamiento.classList.add('completed');
      lineTratARecup.classList.add('completed');
      stepRecuperacion.classList.add('active');
      break;
      
    case 'disponible':
      stepEvaluacion.classList.add('completed');
      lineEvalATrat.classList.add('completed');
      stepTratamiento.classList.add('completed');
      lineTratARecup.classList.add('completed');
      stepRecuperacion.classList.add('completed');
      lineRecupADisp.classList.add('completed');
      stepDisponible.classList.add('active');
      break;
      
    default:
      // Por defecto o estado desconocido, dejar Evaluación como activo
      stepEvaluacion.classList.add('active');
      break;
  }
}
