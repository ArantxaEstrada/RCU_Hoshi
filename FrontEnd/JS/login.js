
async function login() {
  const boleta = document.getElementById("boleta").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();

  if (!/^\d{10}$/.test(boleta)) {
    alert("La boleta debe contener exactamente 10 dígitos.");
    return;
  }

  if (contrasena.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boleta, contrasena }),
    });

    const result = await response.json();

    if (response.ok) {
      window.location.href = "/main.html";
    } else {
      alert(result.message || "Credenciales incorrectas.");
    }
  } catch (error) {
    console.error("Error en login:", error);
    alert("Hubo un problema al iniciar sesión. Intenta más tarde.");
  }
}