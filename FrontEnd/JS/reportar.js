// Datos cargados
let edificios = [];
let areas = [];
let salones = [];
let dispositivos = [];
let inventario = [];

document.addEventListener("DOMContentLoaded", async () => {
  const enviarBtn = document.querySelector('[data-action="enviar"]');
  const volverBtn = document.querySelector('[data-action="volver"]');

  const edificioSelect = document.getElementById("edificio");
  const areaSelect = document.getElementById("area");
  const salonSelect = document.getElementById("salon");
  const dispositivoSelect = document.getElementById("dispositivo");

  if (enviarBtn) {
    enviarBtn.addEventListener("click", enviarReporte);
  }

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/main";
    });
  }

  // Cargar todo al inicio
  await cargarTodo();

  // Mostrar edificios
  edificios.forEach(e => {
    const option = document.createElement('option');
    option.value = e.id;
    option.textContent = e.ed_nombre || `Edificio ${e.id}`;
    edificioSelect.appendChild(option);
  });

  // Listeners para filtrar
  edificioSelect.addEventListener("change", () => {
    const edId = parseInt(edificioSelect.value);
    areaSelect.innerHTML = '<option value="">Selecciona un área</option>';
    salonSelect.innerHTML = '<option value="">Selecciona un salón</option>';
    dispositivoSelect.innerHTML = '<option value="">Selecciona un dispositivo</option>';
    areaSelect.disabled = !edId;
    salonSelect.disabled = true;
    dispositivoSelect.disabled = true;

    if (edId) {
      const filteredAreas = areas.filter(a => a.ed_id === edId);
      filteredAreas.forEach(a => {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = a.area_nombre || `Área ${a.id}`;
        areaSelect.appendChild(option);
      });
    }
  });

  areaSelect.addEventListener("change", () => {
    const areaId = parseInt(areaSelect.value);
    salonSelect.innerHTML = '<option value="">Selecciona un salón</option>';
    dispositivoSelect.innerHTML = '<option value="">Selecciona un dispositivo</option>';
    salonSelect.disabled = !areaId;
    dispositivoSelect.disabled = true;

    if (areaId) {
      const filteredSalones = salones.filter(s => s.area_id === areaId);
      filteredSalones.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.sal_nombre || `Salón ${s.id}`;
        salonSelect.appendChild(option);
      });
    }
  });

  salonSelect.addEventListener("change", () => {
    const salonId = parseInt(salonSelect.value);
    dispositivoSelect.innerHTML = '<option value="">Selecciona un dispositivo</option>';
    dispositivoSelect.disabled = !salonId;

    if (salonId) {
      const filteredDisps = dispositivos.filter(d => d.sal_id === salonId);
      filteredDisps.forEach(d => {
        const inv = inventario.find(i => i.id === d.tipo_id);
        const nombre = inv?.inv_nombre || 'Dispositivo';
        const etiqueta = d.disp_etiqueta || d.disp_serial || d.id;
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = `${nombre} (${etiqueta})`;
        dispositivoSelect.appendChild(option);
      });
    }
  });
});

async function cargarTodo() {
  try {
    const [resEd, resArea, resSalon, resDisp, resInv] = await Promise.all([
      fetch('/api/edificios'),
      fetch('/api/areas'),
      fetch('/api/salones'),
      fetch('/api/dispositivos'),
      fetch('/api/inventario')
    ]);

    const [dataEd, dataArea, dataSalon, dataDisp, dataInv] = await Promise.all([
      resEd.json(),
      resArea.json(),
      resSalon.json(),
      resDisp.json(),
      resInv.json()
    ]);

    edificios = dataEd.edificios || [];
    areas = dataArea.areas || [];
    salones = dataSalon.salones || [];
    dispositivos = dataDisp.dispositivos || [];
    inventario = dataInv.inventario || [];
  } catch (err) {
    console.error('Error al cargar datos:', err);
    alert('Error al cargar catálogos');
  }
}

async function enviarReporte() {
  const edificio = document.getElementById("edificio").value;
  const area = document.getElementById("area").value;
  const salon = document.getElementById("salon").value;
  const dispositivo = document.getElementById("dispositivo").value;
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!edificio) {
    alert("Por favor selecciona un edificio.");
    return;
  }

  if (!area) {
    alert("Por favor selecciona un área.");
    return;
  }

  if (!salon) {
    alert("Por favor selecciona un salón.");
    return;
  }

  if (!dispositivo) {
    alert("Por favor selecciona un dispositivo.");
    return;
  }

  if (descripcion.length < 10) {
    alert("La descripción debe tener al menos 10 caracteres.");
    return;
  }

  const res = await fetch("/reportes/generar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salon, dispositivo, descripcion }),
  });

  const data = await res.json();
  if (res.ok && data.success) {
    window.location.href = "/reporteveri";
  } else {
    alert(data.message || "Error al enviar el reporte.");
  }
}
