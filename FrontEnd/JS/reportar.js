function enviarReporte() {
    const salon = document.getElementById("salon").value;
    const dispositivo = document.getElementById("dispositivo").value;
    const descripcion = document.getElementById("descripcion").value.trim();

    if (salon === "nadita" || dispositivo === "nadita" || descripcion === "") {
        alert("Por favor completa todos los campos.");
        return;
    }

    const reporte = {
        salon,
        dispositivo,
        descripcion,
        fecha: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reporte, null, 2)], { type: "application/json" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `reporte_${Date.now()}.json`;
    enlace.click();

    alert("Reporte generado y descargado como JSON.");
}
