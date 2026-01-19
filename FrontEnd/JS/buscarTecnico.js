document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formBuscar");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/tecnicos";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await buscarTecnico();
    });
  }
});

function mostrarError(mensaje) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.textContent = mensaje;
  errorContainer.classList.add("show");

  setTimeout(() => {
    errorContainer.classList.remove("show");
  }, 5000);
}

async function buscarTecnico() {
  try {
    const btnBuscar = document.getElementById("btnBuscar");
    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Buscando...';

    const id_tecnico = document.getElementById("id_tecnico").value;

    const regexId = /^[0-9]{10}$/;
    const idTrim = id_tecnico.trim();

    if (!idTrim) {
      mostrarError('Por favor, ingrese un ID');
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = '<span class="material-symbols-outlined">search</span> Buscar';
      return;
    }

    if (!regexId.test(idTrim)) {
      mostrarError('El ID debe contener exactamente 10 dígitos');
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = '<span class="material-symbols-outlined">search</span> Buscar';
      return;
    }

    const response = await fetch('/tecnicos/buscar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_tecnico: idTrim
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      mostrarError(data.message || 'Error al buscar el técnico');
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = '<span class="material-symbols-outlined">search</span> Buscar';
      return;
    }

    // Guardar técnico en sessionStorage y navegar
    sessionStorage.setItem('tecnicoEncontrado', JSON.stringify(data.tecnico));
    window.location.href = '/tecnicos/detalles';

  } catch (error) {
    mostrarError('Error al buscar el técnico');
    const btnBuscar = document.getElementById("btnBuscar");
    btnBuscar.disabled = false;
    btnBuscar.innerHTML = '<span class="material-symbols-outlined">search</span> Buscar';
  }
}

