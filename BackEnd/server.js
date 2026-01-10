import express from 'express';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import supabase from './dbconfig.js';
import routes from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Resolver rutas absolutas de forma robusta en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // .../RCU_Hoshi/BackEnd
// Raíz del proyecto (carpeta que contiene FrontEnd y BackEnd)
const rootDir = path.resolve(__dirname, '..'); // .../RCU_Hoshi

// Configuración de middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Servir archivos estáticos desde FrontEnd (CSS, JS, img)
const publicDir = path.join(rootDir, 'FrontEnd');
app.use(express.static(publicDir));
// También con prefijo /FrontEnd (los enlaces actuales usan este prefijo)
app.use('/FrontEnd', express.static(publicDir));

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
  // eslint-disable-next-line no-console
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

