let dispositivo = null;
let catalogos = { inventario: [], salones: [], areas: [] };

document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const btnEditar = document.getElementById('btnEditar');

  if (volverBtn) volverBtn.addEventListener("click", () => window.location.href = '/dispositivos/buscar');
  if (btnEditar) btnEditar.addEventListener("click", () => {
    sessionStorage.setItem('dispositivoAEditar', JSON.stringify(dispositivo));
    window.location.href = '/dispositivos/editar';
  });

  const almacenado = sessionStorage.getItem('dispositivoEncontrado');
  if (!almacenado) {
    window.location.href = '/dispositivos/buscar';
    return;
  }

  dispositivo = JSON.parse(almacenado);
  // Mantener dispositivo en sessionStorage para editar
  sessionStorage.setItem('dispositivoEncontrado', JSON.stringify(dispositivo));

  await cargarCatalogos();
  mostrarDatos();
});

async function cargarCatalogos() {
  try {
    const [invRes, salonRes, areaRes] = await Promise.all([
      fetch('/api/inventario'),
      fetch('/api/salones'),
      fetch('/api/areas')
    ]);
    const invData = await invRes.json();
    const salonData = await salonRes.json();
    const areaData = await areaRes.json();

    catalogos.inventario = invData.inventario || [];
    catalogos.salones = salonData.salones || [];
    catalogos.areas = areaData.areas || [];
  } catch (err) {
  }
}

function mostrarDatos() {
  if (!dispositivo) return;

  const tipo = catalogos.inventario.find(t => String(t.id) === String(dispositivo.tipo_id));
  const salon = catalogos.salones.find(s => String(s.id) === String(dispositivo.sal_id));
  const area = salon ? catalogos.areas.find(a => String(a.id) === String(salon.area_id)) : null;

  document.getElementById('infoId').textContent = dispositivo.id;
  document.getElementById('infoSerial').textContent = dispositivo.disp_serial;
  document.getElementById('infoCodigo').textContent = dispositivo.disp_codigo;
  document.getElementById('infoEtiqueta').textContent = dispositivo.disp_etiqueta;
  document.getElementById('infoTipo').textContent = tipo ? tipo.inv_nombre : 'Desconocido';
  document.getElementById('infoSalon').textContent = salon ? salon.sal_nombre : 'Desconocido';
  document.getElementById('infoArea').textContent = area ? area.area_nombre : 'Desconocido';
  document.getElementById('infoEstado').textContent = dispositivo.disp_estado_actv ? 'Activo' : 'Inactivo';
}

