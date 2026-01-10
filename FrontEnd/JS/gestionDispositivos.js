document.addEventListener("DOMContentLoaded", () => {
  const acciones = {
    agregar: "/dispositivos/agregar",
    buscar: "/dispositivos/buscar",
    informe: "/dispositivos/informe",
    volver: "/main"
  };

  document.querySelectorAll(".btn-action").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (acciones[action]) {
        window.location.href = acciones[action];
      }
    });
  });
});

