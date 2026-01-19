let salones = [];

document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  if (volverBtn) volverBtn.addEventListener("click", () => window.location.href = '/dispositivos');

  await cargarSalones();
});

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");
  setTimeout(() => errorContainer.classList.remove("show"), 5000);
}

async function cargarSalones() {
  try {
    const resp = await fetch('/api/salones');
    const data = await resp.json();
    salones = data.salones || [];
    const select = document.getElementById('salon');
    select.innerHTML = '<option value="">Selecciona un salón</option>';
    salones.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = formatearNombreSalon(s.sal_nombre);
      select.appendChild(opt);
    });
  } catch (err) {
    mostrarError('Error al cargar salones');
  }
}

function formatearNombreSalon(nombre) {
  if (!nombre) return nombre;
  if (/^\d+$/.test(nombre.trim())) {
    return `Salón ${nombre}`;
  }
  return nombre;
}

async function cargarInforme() {
  try {
    const salon = document.getElementById('salon').value;
    if (!salon) {
      mostrarError('Selecciona un salón.');
      return;
    }

    const resp = await fetch(`/api/dispositivos/informe?sal_id=${salon}`);
    const data = await resp.json();

    if (!resp.ok || !data.success) {
      mostrarError(data.message || 'Error al cargar informe');
      return;
    }

    document.getElementById('statsSection').style.display = 'block';
    renderEstadisticas(data.estadisticas);
    renderListado(data.dispositivos, salon);
  } catch (err) {
    mostrarError('Error al cargar informe');
  }
}

function renderEstadisticas(estadisticas) {
  document.getElementById('statTotal').textContent = estadisticas.total || 0;
  document.getElementById('statActivos').textContent = estadisticas.activos || 0;
  document.getElementById('statInactivos').textContent = estadisticas.inactivos || 0;
}

function renderListado(dispositivos, salonId) {
  const cont = document.getElementById('listaDispositivos');
  const salon = salones.find(s => String(s.id) === String(salonId));

  if (!dispositivos || dispositivos.length === 0) {
    cont.innerHTML = '<div class="empty-message">No hay dispositivos en este salón</div>';
    return;
  }

  cont.innerHTML = '';
  dispositivos.forEach(d => {
    const item = document.createElement('div');
    item.className = 'info-section';

    const estadoClass = d.disp_estado_actv ? 'status-badge activo' : 'status-badge inactivo';
    const estadoTexto = d.disp_estado_actv ? '✓ Activo' : '✗ Inactivo';

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div style="font-weight: bold; color: #7A0B1E;">ID #${d.id}</div>
        <span class="${estadoClass}">${estadoTexto}</span>
      </div>
      <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.3rem;">Serial: <strong>${d.disp_serial}</strong></div>
      <div style="font-size: 0.85rem; color: #666;">Etiqueta: <strong>${d.disp_etiqueta || '-'}</strong></div>
    `;

    cont.appendChild(item);
  });
}

