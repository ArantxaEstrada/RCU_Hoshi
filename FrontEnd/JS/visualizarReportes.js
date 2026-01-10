
document.addEventListener("DOMContentLoaded", () => {
  const volverBtn = document.querySelector(".btn-enviar");
  if (volverBtn) {
    volverBtn.addEventListener("click", () => {
      window.location.href = "/gestion-reportes";
    });
  }

  const filtros = {
    todos: () => true,
    pendientes: (status) => status.classList.contains("red"),
    proceso: (status) => status.classList.contains("yellow"),
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
