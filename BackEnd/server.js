import express from 'express';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import supabase from './dbconfig.js';
import routes from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname apunta a BackEnd; definimos rootDir como la carpeta del proyecto
const backendDir = path.resolve();
const rootDir = path.join(backendDir, '..');

// Configuración de middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Servir archivos estáticos desde FrontEnd (CSS, JS, img)
app.use(express.static(path.join(rootDir, 'FrontEnd')));
// 2) Sirve con prefijo /FrontEnd para coincidir con enlaces existentes
app.use('/FrontEnd', express.static(path.join(rootDir, 'FrontEnd')));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'rcu-hoshi-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a true en producción con HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

// Configuración de vistas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'FrontEnd', 'Views'));

// Usar rutas
app.use('/', routes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
