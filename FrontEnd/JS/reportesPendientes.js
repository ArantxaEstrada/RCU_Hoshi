let dispositivos = [];
let inventario = [];

document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/gestion-reportes";
    });
  }

  // Cargar datos
  await cargarDatos();
});

async function cargarDatos() {
  try {
    const resReportes = await fetch('/api/reportes-pendientes');

    const dataReportes = await resReportes.json();

    if (!resReportes.ok || !dataReportes.success) {
      mostrarError('Error al cargar reportes pendientes');
      return;
    }

    const reportes = dataReportes.reportes || [];

    if (reportes.length === 0) {
      mostrarVacio();
    } else {
      mostrarReportes(reportes);
    }
  } catch (err) {
    mostrarError('Error al cargar los datos');
  }
}

function mostrarError(mensaje) {
  const errorContainer = document.getElementById('error-container');
  const tableContainer = document.getElementById('table-container');

  errorContainer.innerHTML = `<div class="error-message">${mensaje}</div>`;
  tableContainer.innerHTML = '';
}

function mostrarVacio() {
  const tableContainer = document.getElementById('table-container');
  tableContainer.innerHTML = '<div class="empty-message">No tienes reportes pendientes</div>';
}

function mostrarReportes(reportes) {
  const tableContainer = document.getElementById('table-container');

  let html = `
    <table>
      <thead>
        <tr>
          <th>Dispositivo</th>
          <th>Fecha de Levantamiento</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
  `;

  reportes.forEach((rep, idx) => {
    const disp = rep.dispositivo;
    const nombre = disp?.inventario?.inv_nombre || 'Desconocido';
    const serial = disp?.disp_serial || 'N/A';
    const fecha = formatDate(rep.rep_fecha_lev);

    html += `
      <tr onclick="verDetalle(${rep.id})">
        <td>${nombre} ${serial}</td>
        <td>${fecha}</td>
        <td class="status-cell">
          <div class="status-dot pendiente"></div>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  tableContainer.innerHTML = html;
}

function formatDate(fechaString) {
  const fecha = new Date(fechaString);
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
}

function verDetalle(reporteId) {
  window.location.href = `/reporte-detalle/${reporteId}?from=pendientes`;
}

