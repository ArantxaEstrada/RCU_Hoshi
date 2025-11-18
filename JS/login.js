// Validar inicio de sesion
function login() {
    var boleta = document.getElementById("boleta").value;
    var password = document.getElementById("contrasena").value;
    if(boleta === null || password === null || boleta.length === 0 || password.length === 0){
        alert("Por favor, complete todos los campos.");
        return;
    }

    if(boleta.length != 10){
        alert("La boleta debe tener 10 digitos.");
        return;
    }

    if(boleta === "1111111111" && password === "1234"){
        window.location.href = "./main.html";
    }
}
//Cuando veamos bien la conexion con la base de datos, lo conecto. -Atte. Rodrigo (Dev1)
