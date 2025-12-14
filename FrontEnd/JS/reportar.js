
function enviarReporte() {
  const salon = document.getElementById("salon").value;
  const dispositivo = document.getElementById("dispositivo").value;
  const descripcion = document.getElementById("descripcion").value.trim();

  if (salon === "nadita") {
    alert("Por favor selecciona un salón.");
    return;
  }

  if (dispositivo === "nadita") {
    alert("Por favor selecciona un dispositivo.");
    return;
  }

  if (descripcion.length < 10) {
    alert("La descripción debe tener al menos 10 caracteres.");
    return;
  }

  fetch("/reportes/generar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salon, dispositivo, descripcion }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Reporte enviado correctamente.");
        window.location.href = "main.html";
      } else {
        alert(data.message || "Error al enviar el reporte.");
      }
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("Hubo un problema al enviar el reporte.");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector(".btn-volver");
  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "main.html";
    });
  }
});