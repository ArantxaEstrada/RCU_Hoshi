import { Router } from 'express';
import {
    login,
    logout,
    verificarSesion,
    requireAuth,
    crearReporte,
    obtenerReportesAlumno,
    obtenerDetalleReporte,
    obtenerEdificios,
    obtenerAreas,
    obtenerSalones,
    obtenerDispositivos,
    obtenerInventario
} from './controller.js';
import path from 'path';

const router = Router();
const backendDir = path.resolve();
const rootDir = path.join(backendDir, '..');

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
                console.error('Error al actualizar sesión:', updateError);
            }
        }

        req.session.destroy();
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error al cerrar sesión silenciosa:', error);
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

router.get('/reporteveri', requireAuth, (req, res) => {
    res.sendFile(path.join(rootDir, 'FrontEnd', 'Views', 'reporteveri.html'));
});

// Endpoints de API para reportes
router.get('/api/mis-reportes', requireAuth, obtenerReportesAlumno);
router.get('/api/reporte/:id', requireAuth, obtenerDetalleReporte);

// Catálogos para creación de reportes
router.get('/api/edificios', requireAuth, obtenerEdificios);
router.get('/api/areas', requireAuth, obtenerAreas);
router.get('/api/salones', requireAuth, obtenerSalones);
router.get('/api/dispositivos', requireAuth, obtenerDispositivos);
router.get('/api/inventario', requireAuth, obtenerInventario);

// Endpoint para crear reporte
router.post('/reportes/generar', requireAuth, crearReporte);

export default router;
