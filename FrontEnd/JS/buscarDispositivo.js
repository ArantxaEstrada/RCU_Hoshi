document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formBuscar");

  if (volverBtn) volverBtn.addEventListener("click", () => {
    window.location.href = "/dispositivos";
  });

  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await buscarDispositivo();
  });
});

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");
  setTimeout(() => errorContainer.classList.remove("show"), 5000);
}

async function buscarDispositivo() {
  try {
    const serial = document.getElementById("serial").value.trim();
    const regexNum = /^[0-9]{1,20}$/;

    if (!serial) {
      mostrarError('Ingresa el serial del dispositivo.');
      return;
    }

    if (!regexNum.test(serial)) {
      mostrarError('El serial solo puede contener números.');
      return;
    }

    const resp = await fetch('/dispositivos/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serial: parseInt(serial, 10) })
    });

    const data = await resp.json();
    if (!resp.ok || !data.success) {
      mostrarError(data.message || 'No se encontró el dispositivo.');
      return;
    }

    sessionStorage.setItem('dispositivoEncontrado', JSON.stringify(data.dispositivo));
    window.location.href = '/dispositivos/detalles';
  } catch (err) {
    mostrarError('Error al buscar dispositivo.');
  }
}

