
document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector(".btn-action");
  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "alumnos.html";
    });
  }

  const form = document.querySelector(".login-form");
  form.addEventListener("submit", (e) => {
    const nombre = document.getElementById("nombre").value.trim();
    const boleta = document.getElementById("boleta").value.trim();

    if (!/^\d{10}$/.test(boleta)) {
      e.preventDefault();
      alert("La boleta debe contener exactamente 10 dígitos.");
      return;
    }

    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar al alumno ${nombre} con boleta ${boleta}?`
    );
    if (!confirmacion) {
      e.preventDefault();
    }
  });
});