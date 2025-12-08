
document.addEventListener("DOMContentLoaded", () => {
  const acciones = {
    reporte: "reporte.ejs",
    consulta: "consulta.ejs",
    visreportes: "visreportes.html",
    alumnos: "/FrontEnd/Views/Alumnos/alumnos.html",
    tecnicos: "consulta.ejs",
    logout: "index.html"
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