// Validar inicio de sesion
function login() {
    var boleta = document.getElementById("boleta").value;
    var password = document.getElementById("contrasena").value;
    if(boleta === null || password === null || boleta.length === 0 || password.length === 0){
        alert("Por favor, complete todos los campos.");
        return;
    }

    if(boleta === 2024090213 && password === "1234"){
        window.location.href = "home2.html";
    }
}
//Cuando veamos bien la conexion con la base de datos, lo conecto. -Atte Rodrigo (Dev1)
