
document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector(".btn-enviar");
  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "main.html";
    });
  }

  const filtros = {
    todos: () => true,
    pendientes: (status) => status.classList.contains("red"),
    proceso: (status) => status.classList.contains("yellow"),
    resueltos: (status) => status.classList.contains("green"),
  };

  function aplicarFiltro(tipo) {
    document.querySelectorAll(".reporte").forEach((reporte) => {
      const status = reporte.querySelector(".status");
      if (filtros[tipo](status)) {
        reporte.style.display = "flex";
      } else {
        reporte.style.display = "none";
      }
    });
  }

});