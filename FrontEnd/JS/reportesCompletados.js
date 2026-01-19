let dispositivos = [];
let inventario = [];

document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/gestion-reportes";
    });
  }

  await cargarDatos();
});

async function cargarDatos() {
  try {
    const resReportes = await fetch('/api/reportes-completados');

    const dataReportes = await resReportes.json();

    if (!dataReportes.success) {
      mostrarError('Error al cargar los reportes');
      return;
    }

    renderReportes(dataReportes.reportes || []);
  } catch (err) {
    mostrarError('Error al cargar los datos');
  }
}

function mostrarError(mensaje) {
  const tableContainer = document.getElementById('table-container');
  tableContainer.innerHTML = `<div class="error-message">${mensaje}</div>`;
}

function renderReportes(reportes) {
  const tableContainer = document.getElementById('table-container');

  if (reportes.length === 0) {
    tableContainer.innerHTML = '<div class="no-data">No hay reportes completados</div>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Dispositivo</th>
          <th>Fecha de Resolución</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
  `;

  reportes.forEach((rep) => {
    const disp = rep.dispositivo;
    const nombre = disp?.inventario?.inv_nombre || 'Desconocido';
    const serial = disp?.disp_serial || 'N/A';
    const fecha = formatDate(rep.rep_fecha_res);

    html += `
      <tr onclick="verDetalle(${rep.id})">
        <td>${nombre} ${serial}</td>
        <td>${fecha}</td>
        <td class="status-cell">
          <div class="status-dot completado"></div>
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
  if (!fechaString) return 'N/A';
  const fecha = new Date(fechaString);
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
}

function verDetalle(reporteId) {
  window.location.href = `/reporte-detalle/${reporteId}?from=completados`;
}
