import supabase from './dbconfig.js';

// Obtener perfil del usuario actual
export const obtenerPerfil = async (req, res) => {
    try {
        if (!req.session.perfilId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        return res.status(200).json({
            success: true,
            perfil: req.session.perfilId
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Login de usuario
export const login = async (req, res) => {
    try {
        const { boleta, correo, contrasena } = req.body;

        // Validar que se reciban los datos
        if (!boleta || !correo || !contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Boleta, correo y contraseña son requeridos'
            });
        }

        // Buscar usuario por boleta (id) y correo en la tabla usuarios
        const { data: usuario, error: errorUsuario } = await supabase
            .from('usuarios')
            .select('id, perf_tipo, est_tipo, usr_correo, usr_pass')
            .eq('id', boleta)
            .eq('usr_correo', correo)
            .single();

        if (errorUsuario || !usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Reglas de estado:
        // est_tipo = 1 -> activo
        // est_tipo = 2 -> baja (no debe acceder)
        if (usuario.est_tipo === 2) {
            return res.status(403).json({
                success: false,
                message: 'Usuario dado de baja. Acceso denegado.'
            });
        }
        if (usuario.est_tipo !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Usuario inactivo o bloqueado'
            });
        }

        // Verificar contraseña (en producción deberías usar bcrypt)
        if (usuario.usr_pass !== contrasena) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Cerrar sesiones anteriores del usuario
        await supabase
            .from('sesion')
            .update({
                ses_status: false,
                ses_fecha_f: new Date().toISOString()
            })
            .eq('usr_id', usuario.id)
            .eq('ses_status', true);

        // Obtener el id más alto de la tabla sesion y sumarle 1
        const { data: maxSesion, error: errorMax } = await supabase
            .from('sesion')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        // Si no hay registros o hay error, iniciar en 1
        const nuevoId = (errorMax || !maxSesion) ? 1 : maxSesion.id + 1;

        // Crear nueva sesión en la base de datos con id incremental
        const { data: nuevaSesion, error: errorSesion } = await supabase
            .from('sesion')
            .insert({
                id: nuevoId,
                usr_id: usuario.id,
                perf_id: usuario.perf_tipo,
                ses_status: true,
                ses_fecha_i: new Date().toISOString()
            })
            .select()
            .single();

        if (errorSesion) {
            console.error('Error al crear sesión:', errorSesion);
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar sesión'
            });
        }

        // Guardar datos en la sesión de Express
        req.session.userId = usuario.id;
        req.session.sessionId = nuevaSesion.id;
        req.session.perfilId = usuario.perf_tipo;
        req.session.boleta = usuario.id;

        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            user: {
                id: usuario.id,
                boleta: usuario.id,
                perfil: usuario.perf_tipo
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Logout de usuario
export const logout = async (req, res) => {
    try {
        if (req.session.sessionId) {
            // Actualizar sesión en la base de datos con fecha de fin
            const { error: updateError } = await supabase
                .from('sesion')
                .update({
                    ses_status: false,
                    ses_fecha_f: new Date().toISOString()
                })
                .eq('id', req.session.sessionId);

            if (updateError) {
                console.error('Error al actualizar sesión en BD:', updateError);
            }
        }

        // Destruir sesión de Express
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al destruir sesión:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al cerrar sesión'
                });
            }

            res.clearCookie('connect.sid');
            return res.status(200).json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });
        });

    } catch (error) {
        console.error('Error en logout:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Verificar si hay sesión activa
export const verificarSesion = async (req, res) => {
    try {
        if (!req.session.userId || !req.session.sessionId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        // Verificar que la sesión siga activa en la base de datos
        const { data: sesion, error } = await supabase
            .from('sesion')
            .select('id, ses_status')
            .eq('id', req.session.sessionId)
            .eq('ses_status', true)
            .single();

        if (error || !sesion) {
            // Actualizar ses_fecha_f cuando se detecta sesión inválida
            await supabase
                .from('sesion')
                .update({
                    ses_status: false,
                    ses_fecha_f: new Date().toISOString()
                })
                .eq('id', req.session.sessionId);

            // Destruir sesión de Express
            req.session.destroy();
            return res.status(401).json({
                success: false,
                message: 'Sesión expirada o inválida'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sesión activa',
            user: {
                id: req.session.userId,
                boleta: req.session.boleta,
                perfil: req.session.perfilId
            }
        });

    } catch (error) {
        console.error('Error al verificar sesión:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Middleware para proteger rutas
export const requireAuth = async (req, res, next) => {
    try {
        if (!req.session.userId || !req.session.sessionId) {
            // Redirigir a página de sesión expirada en lugar de devolver JSON
            return res.redirect('/sesion-expirada');
        }

        // Verificar que la sesión esté activa
        const { data: sesion, error } = await supabase
            .from('sesion')
            .select('ses_status')
            .eq('id', req.session.sessionId)
            .eq('ses_status', true)
            .single();

        if (error || !sesion) {
            // Actualizar ses_fecha_f cuando se detecta sesión inválida
            await supabase
                .from('sesion')
                .update({
                    ses_status: false,
                    ses_fecha_f: new Date().toISOString()
                })
                .eq('id', req.session.sessionId);

            req.session.destroy();
            // Redirigir a página de sesión expirada
            return res.redirect('/sesion-expirada');
        }

        next();
    } catch (error) {
        console.error('Error en middleware requireAuth:', error);
        // Redirigir a página de sesión expirada en caso de error
        return res.redirect('/sesion-expirada');
    }
};

// Obtener reportes del alumno actual
export const obtenerReportesAlumno = async (req, res) => {
    try {
        const alumno_boleta = req.session.userId;

        if (!alumno_boleta) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        // Obtener reportes del alumno con información de salón y dispositivo
        const { data: reportes, error: errorReportes } = await supabase
            .from('reporte')
            .select(`
                id,
                rep_fecha_lev,
                rep_fecha_res,
                rep_estado,
                rep_fecha_asig_tec,
                tec_id,
                sal_id,
                disp_id,
                al_boleta,
                salon:sal_id(id),
                dispositivo:disp_id(id)
            `)
            .eq('al_boleta', alumno_boleta)
            .order('rep_fecha_lev', { ascending: false });

        if (errorReportes) {
            console.error('Error al obtener reportes:', errorReportes);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reportes'
            });
        }

        return res.status(200).json({
            success: true,
            reportes: reportes || []
        });

    } catch (error) {
        console.error('Error en obtenerReportesAlumno:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener detalles de un reporte específico
export const obtenerDetalleReporte = async (req, res) => {
    try {
        const { id } = req.params;
        const alumno_boleta = req.session.userId;

        if (!id || !alumno_boleta) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros inválidos'
            });
        }

        // Obtener reporte verificando que pertenezca al alumno actual
        const { data: reporte, error: errorReporte } = await supabase
            .from('reporte')
            .select('*')
            .eq('id', id)
            .eq('al_boleta', alumno_boleta)
            .single();

        if (errorReporte || !reporte) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            reporte: reporte
        });

    } catch (error) {
        console.error('Error en obtenerDetalleReporte:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Catálogos para creación de reportes
export const obtenerEdificios = async (_req, res) => {
    const { data, error } = await supabase
        .from('edificio')
        .select('*');

    if (error) {
        console.error('Error al obtener edificios:', error);
        return res.json({ success: false, edificios: [] });
    }

    return res.json({ success: true, edificios: data || [] });
};

export const obtenerAreas = async (req, res) => {
    const { data, error } = await supabase
        .from('area')
        .select('*');

    if (error) {
        console.error('Error al obtener áreas:', error);
        return res.json({ success: false, areas: [] });
    }

    return res.json({ success: true, areas: data || [] });
};

export const obtenerSalones = async (req, res) => {
    const { data, error } = await supabase
        .from('salon')
        .select('*');

    if (error) {
        console.error('Error al obtener salones:', error);
        return res.json({ success: false, salones: [] });
    }

    return res.json({ success: true, salones: data || [] });
};

export const obtenerDispositivos = async (req, res) => {
    const { data, error } = await supabase
        .from('dispositivo')
        .select('*')
        .eq('disp_estado_actv', true);

    if (error) {
        console.error('Error al obtener dispositivos:', error);
        return res.json({ success: false, dispositivos: [] });
    }

    return res.json({ success: true, dispositivos: data || [] });
};

export const obtenerInventario = async (req, res) => {
    const { data, error } = await supabase
        .from('inventario')
        .select('*');

    if (error) {
        console.error('Error al obtener inventario:', error);
        return res.json({ success: false, inventario: [] });
    }

    return res.json({ success: true, inventario: data || [] });
};

// Crear reporte
export const crearReporte = async (req, res) => {
    try {
        const { salon, dispositivo, descripcion } = req.body;
        const alumno_boleta = req.session.userId; // ID del alumno desde la sesión

        // Validaciones
        if (!salon || !dispositivo || !descripcion) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        if (descripcion.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'La descripción debe tener al menos 10 caracteres'
            });
        }

        // Obtener el id más alto de la tabla reporte y sumarle 1
        const { data: maxReporte, error: errorMax } = await supabase
            .from('reporte')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        const nuevoId = (errorMax || !maxReporte) ? 1 : maxReporte.id + 1;

        // Buscar técnicos y admins activos para asignar automáticamente
        const { data: tecnicos, error: errorTecnicos } = await supabase
            .from('usuarios')
            .select('id')
            .in('perf_tipo', [1, 2]) // Admin o Técnico
            .eq('est_tipo', 1) // Activos
            .order('id');

        if (errorTecnicos || !tecnicos || tecnicos.length === 0) {
            console.error('Error al obtener técnicos:', errorTecnicos);
            return res.status(500).json({
                success: false,
                message: 'No hay técnicos disponibles para asignar'
            });
        }

        // Contar reportes asignados a cada técnico/admin
        const conteoReportes = await Promise.all(
            tecnicos.map(async (tecnico) => {
                const { count, error } = await supabase
                    .from('reporte')
                    .select('*', { count: 'exact', head: true })
                    .eq('tec_id', tecnico.id)
                    .neq('rep_estado', 2); // Excluir reportes completados

                return {
                    id: tecnico.id,
                    reportes: error ? 0 : (count || 0)
                };
            })
        );

        // Encontrar el/los técnicos con menos reportes
        const minReportes = Math.min(...conteoReportes.map(t => t.reportes));
        const tecnicosConMenosReportes = conteoReportes.filter(t => t.reportes === minReportes);

        // Seleccionar uno al azar si hay varios con la misma cantidad
        const tecnicoAsignado = tecnicosConMenosReportes[
            Math.floor(Math.random() * tecnicosConMenosReportes.length)
        ];

        // Crear el reporte con técnico asignado
        const { data: nuevoReporte, error: errorReporte } = await supabase
            .from('reporte')
            .insert({
                id: nuevoId,
                sal_id: parseInt(salon),
                disp_id: parseInt(dispositivo),
                al_boleta: alumno_boleta,
                rep_fecha_lev: new Date().toISOString(),
                rep_estado: 1, // 1 = Pendiente (naranja) - ya asignado
                rep_descripcion: descripcion,
                tec_id: tecnicoAsignado.id,
                rep_fecha_asig_tec: new Date().toISOString()
            })
            .select()
            .single();

        if (errorReporte) {
            console.error('Error al crear reporte:', errorReporte);
            return res.status(500).json({
                success: false,
                message: 'Error al crear el reporte'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Reporte creado exitosamente',
            reporte: nuevoReporte
        });

    } catch (error) {
        console.error('Error en crearReporte:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
