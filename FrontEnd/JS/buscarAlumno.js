document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector('[data-action="volver"]');
  const form = document.getElementById("formBuscar");

  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/alumnos";
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await buscarAlumno();
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

async function buscarAlumno() {
  try {
    const btnBuscar = document.getElementById("btnBuscar");
    btnBuscar.disabled = true;
    btnBuscar.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Buscando...';

    const boleta = document.getElementById("boleta").value;

    const regexBoleta = /^[0-9]{1,20}$/;
    const boletaTrim = boleta.trim();

    if (!boletaTrim) {
      mostrarError('Por favor, ingrese una boleta');
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = '<span class="material-symbols-outlined">search</span> Buscar';
      return;
    }

    if (!regexBoleta.test(boletaTrim)) {
      mostrarError('La boleta solo puede contener números');
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = '<span class="material-symbols-outlined">search</span> Buscar';
      return;
    }

    const response = await fetch('/alumnos/buscar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        boleta: boletaTrim
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      mostrarError(data.message || 'Error al buscar el alumno');
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = '<span class="material-symbols-outlined">search</span> Buscar';
      return;
    }

    // Guardar alumno en sessionStorage y navegar
    sessionStorage.setItem('alumnoEncontrado', JSON.stringify(data.alumno));
    window.location.href = '/alumnos/detalles';

  } catch (error) {
    mostrarError('Error al buscar el alumno');
    const btnBuscar = document.getElementById("btnBuscar");
    btnBuscar.disabled = false;
    btnBuscar.innerHTML = '<span class="material-symbols-outlined">search</span> Buscar';
  }
}

