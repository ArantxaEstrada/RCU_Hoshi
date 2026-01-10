let dispositivo = null;
let catalogos = { inventario: [], salones: [] };

document.addEventListener("DOMContentLoaded", async () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById('formEditar');

  if (volverBtn) volverBtn.addEventListener("click", () => window.location.href = '/dispositivos/detalles');
  if (form) form.addEventListener("submit", async (e) => { e.preventDefault(); await actualizarDispositivo(); });

  const almacenado = sessionStorage.getItem('dispositivoEncontrado');
  if (!almacenado) {
    window.location.href = '/dispositivos/buscar';
    return;
  }

  dispositivo = JSON.parse(almacenado);

  await cargarCatalogos();
  cargarDatos();
});

async function cargarCatalogos() {
  try {
    const [invRes, salonRes] = await Promise.all([
      fetch('/api/inventario'),
      fetch('/api/salones')
    ]);
    const invData = await invRes.json();
    const salonData = await salonRes.json();

    catalogos.inventario = invData.inventario || [];
    catalogos.salones = salonData.salones || [];

    poblarSelect(catalogos.inventario, 'tipo', 'inv_nombre');
    poblarSelect(catalogos.salones, 'salon', 'sal_nombre');
  } catch (err) {
  }
}

function poblarSelect(lista, selectId, labelKey) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Selecciona una opción</option>';
  lista.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item[labelKey];
    select.appendChild(opt);
  });
}

function cargarDatos() {
  if (!dispositivo) return;
  document.getElementById('idDispositivo').value = dispositivo.id;
  document.getElementById('serial').value = dispositivo.disp_serial;
  document.getElementById('codigo').value = dispositivo.disp_codigo;
  document.getElementById('etiqueta').value = dispositivo.disp_etiqueta;
  document.getElementById('tipo').value = dispositivo.tipo_id || dispositivo.inv_tipo;
  document.getElementById('salon').value = dispositivo.sal_id;
  document.getElementById('estado').value = dispositivo.disp_estado_actv ? '1' : '0';
}

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");
  setTimeout(() => errorContainer.classList.remove("show"), 5000);
}

async function actualizarDispositivo() {
  try {
    const serial = document.getElementById('serial').value.trim();
    const codigo = document.getElementById('codigo').value.trim();
    const etiqueta = document.getElementById('etiqueta').value.trim();
    const tipo = document.getElementById('tipo').value;
    const salon = document.getElementById('salon').value;
    const estado = document.getElementById('estado').value;

    const regexNum = /^[0-9]+$/;

    if (!serial || !codigo || !etiqueta || !tipo || !salon) {
      mostrarError('Completa todos los campos');
      return;
    }

    if (!regexNum.test(serial)) {
      mostrarError('El serial solo puede contener números');
      return;
    }

    if (!regexNum.test(codigo)) {
      mostrarError('El código solo puede contener números');
      return;
    }

    const resp = await fetch('/dispositivos/actualizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: dispositivo.id,
        serial: parseInt(serial, 10),
        codigo: parseInt(codigo, 10),
        etiqueta,
        tipo_id: tipo,
        sal_id: salon,
        estado_activo: estado === '1'
      })
    });

    const data = await resp.json();
    if (!resp.ok || !data.success) {
      mostrarError(data.message || 'Error al actualizar dispositivo');
      return;
    }

    alert('Dispositivo actualizado exitosamente');
    window.location.href = '/dispositivos/detalles';
  } catch (err) {
    mostrarError('Error al actualizar dispositivo');
  }
}

