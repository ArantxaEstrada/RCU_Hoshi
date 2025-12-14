
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
    const correo = document.getElementById("correo").value.trim();

    if (!/^\d{10}$/.test(boleta)) {
      e.preventDefault();
      alert("La boleta debe contener exactamente 10 dígitos.");
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@ipn\.mx$/.test(correo)) {
      e.preventDefault();
      alert("El correo debe ser institucional (@ipn.mx).");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(nombre)) {
      e.preventDefault();
      alert("El nombre solo debe contener letras y espacios.");
      return;
    }
  });
});