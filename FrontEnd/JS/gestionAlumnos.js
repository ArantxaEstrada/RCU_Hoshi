

document.addEventListener("DOMContentLoaded", () => {
  const acciones = {
    agregar: "/alumnos/agregar",
    buscar: "/alumnos/buscar",
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
