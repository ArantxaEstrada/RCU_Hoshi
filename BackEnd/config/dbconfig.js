import mysql from 'mysql2'; 
import dotenv from 'dotenv';

// Si vamos a tener una base de datos en servidor
// import {fileURLToPath} from 'url';

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

//dotendv.config({path: path.resolve(__dirname, '../.env')});

dotenv.config();

const config = mysql.createPool({

    host: 'localhost',
    user: 'root',
    password: 'rootroot',
    database: 'curso',

    //conecteion limite : 10
    //acquireTimeout: 30000,
    //idleTimeout: 30000,
});

config.getConnection((err) => {
    if (err) {
        console.log('Error de conexion a la base de datos',err);
        return;
    }
    console.log('Base de datos conectada correctamente');
    connection.release();
});

export default config;