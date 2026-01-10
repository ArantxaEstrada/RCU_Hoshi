import { Router } from 'express';
import {
    login,
    logout,
    verificarSesion,
    requireAuth,
    crearReporte,
    obtenerReportesAlumno,
    obtenerDetalleReporte,
    obtenerReportesPendientes,
    obtenerReportesCompletados,
    obtenerDetalleReporteTecnico,
    obtenerUsuarioActual,
    obtenerInformeTecnico,
    obtenerEdificios,
    obtenerAreas,
    obtenerSalones,
    obtenerDispositivos,
    obtenerInventario,
    buscarAlumno,
    crearAlumno,
    actualizarAlumno,
    eliminarAlumno,
    buscarTecnico,
    crearTecnico,
    actualizarTecnico,
    eliminarTecnico,
    buscarDispositivo,
    crearDispositivo,
    actualizarDispositivo,
    obtenerDispositivosInforme
} from './controller.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Health check para Render/monitoring
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas de autenticación
router.post('/login', login);
router.post('/logout', logout);
router.post('/cerrar-sesion-silenciosa', async (req, res) => {
    try {
        if (req.session.sessionId) {
            // Actualizar sesión en la base de datos con fecha de fin
            const { error: updateError } = await (await import('./dbconfig.js')).default
                .from('sesion')
                .update({
                    ses_status: false,
                    ses_fecha_f: new Date().toISOString()
                })
                .eq('id', req.session.sessionId);

            if (updateError) {
                            }
        }

        req.session.destroy();
        res.status(204).send(); // No content
    } catch (error) {
                res.status(204).send(); // Enviar respuesta exitosa de todas formas
    }
});
router.get('/verificar-sesion', verificarSesion);
router.get('/obtener-perfil', (req, res) => {
    const perfil = req.session.perfilId || null;
    if (perfil) {
        return res.status(200).json({ success: true, perfil });
    }
    return res.status(401).json({ success: false, message: 'No hay sesión activa' });
});

// Página de inicio
router.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'index.html'));
});

// Página de login
router.get('/login', (req, res) => {
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'login.html'));
});

// Página de sesión expirada
router.get('/sesion-expirada', (req, res) => {
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'sesion-expirada.html'));
});

// Página principal protegida (HTML estático)
router.get('/main', requireAuth, (req, res) => {
    // Agregar headers para prevenir caché
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'main.html'));
});

// Rutas de reportes para alumnos
router.get('/reporte', requireAuth, (req, res) => {
    res.render('reporte');
});

router.get('/consulta', requireAuth, (req, res) => {
    res.render('consulta');
});

router.get('/reporte-detalle-alumno/:id', requireAuth, (req, res) => {
    res.render('reporteDetalleAlumno');
});

router.get('/reporteveri', requireAuth, (req, res) => {
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'reporteveri.html'));
});

// Rutas de reportes para admins/técnicos
router.get('/reportes-pendientes', requireAuth, (req, res) => {
    res.render('visreportesad');
});

router.get('/reportes-completados', requireAuth, (req, res) => {
    res.render('visreportescompad');
});

router.get('/gestion-reportes', requireAuth, (req, res) => {
    res.render('Reportes/gestion-reportes');
});

router.get('/reporte-detalle/:id', requireAuth, (req, res) => {
    res.render('reporteDetalle');
});

// Ruta para informe del técnico
router.get('/informe-tecnico', requireAuth, (req, res) => {
    res.render('Tecnicos/informe');
});

// Endpoints de API para reportes de alumnos
router.get('/api/mis-reportes', requireAuth, obtenerReportesAlumno);
router.get('/api/reporte/:id', requireAuth, obtenerDetalleReporte);

// Endpoints de API para reportes de admins/técnicos
router.get('/api/reportes-pendientes', requireAuth, obtenerReportesPendientes);
router.get('/api/reportes-completados', requireAuth, obtenerReportesCompletados);
router.get('/api/reporte-detalle/:id', requireAuth, obtenerDetalleReporteTecnico);

// Catálogos para creación de reportes
router.get('/api/edificios', requireAuth, obtenerEdificios);
router.get('/api/areas', requireAuth, obtenerAreas);
router.get('/api/salones', requireAuth, obtenerSalones);
router.get('/api/dispositivos', requireAuth, obtenerDispositivos);
router.get('/api/inventario', requireAuth, obtenerInventario);

// Endpoint para crear reporte
router.post('/reportes/generar', requireAuth, crearReporte);

// Endpoints para usuario y técnicos
router.get('/api/usuario-actual', requireAuth, obtenerUsuarioActual);
router.get('/api/tecnicos/informe', requireAuth, obtenerInformeTecnico);

// Rutas para gestión de alumnos
router.get('/alumnos', requireAuth, (req, res) => {
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'Alumnos', 'alumnos.html'));
});

router.get('/alumnos/agregar', requireAuth, (req, res) => {
    res.render('Alumnos/agregar');
});

router.get('/alumnos/buscar', requireAuth, (req, res) => {
    res.render('Alumnos/buscar');
});

router.get('/alumnos/detalles', requireAuth, (req, res) => {
    res.render('Alumnos/detalles');
});

router.get('/alumnos/editar', requireAuth, (req, res) => {
    res.render('Alumnos/editar');
});

router.get('/alumnos/eliminar', requireAuth, (req, res) => {
    res.render('Alumnos/eliminar');
});

// Rutas para gestión de dispositivos
router.get('/dispositivos', requireAuth, (req, res) => {
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'Dispositivos', 'dispositivos.html'));
});

router.get('/dispositivos/agregar', requireAuth, (req, res) => {
    res.render('Dispositivos/agregar');
});

router.get('/dispositivos/buscar', requireAuth, (req, res) => {
    res.render('Dispositivos/buscar');
});

router.get('/dispositivos/detalles', requireAuth, (req, res) => {
    res.render('Dispositivos/detalles');
});

router.get('/dispositivos/editar', requireAuth, (req, res) => {
    res.render('Dispositivos/editar');
});

router.get('/dispositivos/informe', requireAuth, (req, res) => {
    res.render('Dispositivos/informe');
});

// Rutas para gestión de técnicos
router.get('/tecnicos', requireAuth, (req, res) => {
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'Tecnicos', 'tecnicos.html'));
});

router.get('/tecnicos/agregar', requireAuth, (req, res) => {
    res.render('Tecnicos/agregar');
});

router.get('/tecnicos/buscar', requireAuth, (req, res) => {
    res.render('Tecnicos/buscar');
});

router.get('/tecnicos/detalles', requireAuth, (req, res) => {
    res.render('Tecnicos/detalles');
});

router.get('/tecnicos/editar', requireAuth, (req, res) => {
    res.render('Tecnicos/editar');
});

router.get('/tecnicos/eliminar', requireAuth, (req, res) => {
    res.render('Tecnicos/eliminar');
});

// Rutas POST para CRUD de Alumnos
router.post('/alumnos/buscar', requireAuth, buscarAlumno);
router.post('/alumnos/crear', requireAuth, crearAlumno);
router.post('/alumnos/actualizar', requireAuth, actualizarAlumno);
router.post('/alumnos/eliminar', requireAuth, eliminarAlumno);

// Rutas POST para CRUD de Técnicos
router.post('/tecnicos/buscar', requireAuth, buscarTecnico);
router.post('/tecnicos/crear', requireAuth, crearTecnico);
router.post('/tecnicos/actualizar', requireAuth, actualizarTecnico);
router.post('/tecnicos/eliminar', requireAuth, eliminarTecnico);

// Rutas POST para CRUD de Dispositivos
router.post('/dispositivos/buscar', requireAuth, buscarDispositivo);
router.post('/dispositivos/crear', requireAuth, crearDispositivo);
router.post('/dispositivos/actualizar', requireAuth, actualizarDispositivo);

// Ruta GET para informe de dispositivos
router.get('/api/dispositivos/informe', requireAuth, obtenerDispositivosInforme);

export default router;

