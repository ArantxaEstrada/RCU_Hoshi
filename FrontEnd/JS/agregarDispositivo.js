document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formAgregar");

  if (volverBtn) volverBtn.addEventListener("click", () => volverDispositivos());
  if (form) form.addEventListener("submit", async (e) => { e.preventDefault(); await crearDispositivo(); });

  cargarCatalogos();
});

function volverDispositivos() {
  window.location.href = "/dispositivos";
}

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");
  setTimeout(() => errorContainer.classList.remove("show"), 5000);
}

async function cargarCatalogos() {
  try {
    const [invRes, areaRes, salonRes] = await Promise.all([
      fetch('/api/inventario'),
      fetch('/api/areas'),
      fetch('/api/salones')
    ]);

    const invData = await invRes.json();
    const areaData = await areaRes.json();
    const salonData = await salonRes.json();

    poblarSelect(invData.inventario || [], 'tipo', 'inv_nombre');
    poblarSelect(areaData.areas || [], 'area', 'area_nombre');
    poblarSelect(salonData.salones || [], 'salon', 'sal_nombre');

    document.getElementById('area').addEventListener('change', () => filtrarSalones(areaData.areas || [], salonData.salones || []));
  } catch (err) {
    mostrarError('Error al cargar catálogos');
  }
}

function poblarSelect(lista, selectId, labelKey) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">Selecciona una opción</option>';
  lista.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item[labelKey];
    select.appendChild(opt);
  });
}

function filtrarSalones(areas, salones) {
  const areaId = document.getElementById('area').value;
  const salonSelect = document.getElementById('salon');
  salonSelect.innerHTML = '<option value="">Selecciona un salón</option>';
  if (!areaId) return;
  salones
    .filter(s => String(s.area_id) === String(areaId))
    .forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.sal_nombre;
      salonSelect.appendChild(opt);
    });
}

async function crearDispositivo() {
  try {
    const btn = document.getElementById("btnCrear");
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Creando...';

    const serial = document.getElementById("serial").value.trim();
    const codigo = document.getElementById("codigo").value.trim();
    const etiqueta = document.getElementById("etiqueta").value.trim();
    const tipo = document.getElementById("tipo").value;
    const area = document.getElementById("area").value;
    const salon = document.getElementById("salon").value;

    const regexNum = /^[0-9]+$/;

    if (!serial || !codigo || !etiqueta || !tipo || !area || !salon) {
      mostrarError('Completa todos los campos');
      resetBtn(btn);
      return;
    }

    if (!regexNum.test(serial)) {
      mostrarError('El serial solo puede contener números');
      resetBtn(btn);
      return;
    }

    if (!regexNum.test(codigo)) {
      mostrarError('El código solo puede contener números');
      resetBtn(btn);
      return;
    }

    const resp = await fetch('/dispositivos/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serial,
        codigo,
        etiqueta,
        tipo_id: tipo,
        sal_id: salon
      })
    });

    const data = await resp.json();
    if (!resp.ok || !data.success) {
      mostrarError(data.message || 'Error al crear dispositivo');
      resetBtn(btn);
      return;
    }

    alert('Dispositivo creado exitosamente');
    volverDispositivos();
  } catch (err) {
    mostrarError('Error al crear dispositivo');
  } finally {
    resetBtn(document.getElementById("btnCrear"));
  }
}

function resetBtn(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.innerHTML = '<span class="material-symbols-outlined">add_circle</span> Crear dispositivo';
}

