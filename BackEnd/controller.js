import supabase from './dbconfig.js';

// Función para obtener la fecha y hora actual en zona horaria de México
const obtenerFechaMexico = () => {
    const fecha = new Date();
    // Obtener la fecha en formato de México usando toLocaleString
    const opciones = {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const fechaStr = fecha.toLocaleString('en-CA', opciones); // en-CA da formato YYYY-MM-DD
    // Reconstruir en formato ISO
    const [fechaParte, horaParte] = fechaStr.split(', ');
    return `${fechaParte}T${horaParte}.000Z`;
};

// Función para parsear una fecha datetime-local como hora de México
const parsearFechaMexico = (fechaStr) => {
    // fechaStr viene en formato "2026-01-19T11:00"
    // Necesitamos interpretarlo como hora de México
    const fecha = new Date(fechaStr);

    // Convertir a string en zona horaria de México
    const opciones = {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const fechaMxStr = fecha.toLocaleString('en-CA', opciones);
    const [fechaParte, horaParte] = fechaMxStr.split(', ');
    const fechaIso = `${fechaParte}T${horaParte}.000Z`;

    // Ahora calculamos la diferencia entre lo que el usuario ingresó y lo que salió
    // para extraer correctamente la hora de México
    const partes = fechaStr.split('T');
    const horaIngresada = partes[1]; // "11:00"

    // Reconstruir la fecha ISO usando la hora que el usuario ingresó
    return `${fechaParte}T${horaIngresada}:00.000Z`;
};

// Exportar las funciones para usar en routes.js
export { obtenerFechaMexico, parsearFechaMexico };

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
                ses_fecha_f: obtenerFechaMexico()
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
                ses_fecha_i: obtenerFechaMexico()
            })
            .select()
            .single();

        if (errorSesion) {
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
                    ses_fecha_f: obtenerFechaMexico()
                })
                .eq('id', req.session.sessionId);

            if (updateError) {
                            }
        }

        // Destruir sesión de Express
        req.session.destroy((err) => {
            if (err) {
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
                    ses_fecha_f: obtenerFechaMexico()
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
                    ses_fecha_f: obtenerFechaMexico()
                })
                .eq('id', req.session.sessionId);

            req.session.destroy();
            // Redirigir a página de sesión expirada
            return res.redirect('/sesion-expirada');
        }

        next();
    } catch (error) {
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
                return res.json({ success: false, edificios: [] });
    }

    return res.json({ success: true, edificios: data || [] });
};

export const obtenerAreas = async (req, res) => {
    const { data, error } = await supabase
        .from('area')
        .select('*');

    if (error) {
                return res.json({ success: false, areas: [] });
    }

    return res.json({ success: true, areas: data || [] });
};

export const obtenerSalones = async (req, res) => {
    const { data, error } = await supabase
        .from('salon')
        .select('*');

    if (error) {
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
                return res.json({ success: false, dispositivos: [] });
    }

    return res.json({ success: true, dispositivos: data || [] });
};

export const obtenerInventario = async (req, res) => {
    const { data, error } = await supabase
        .from('inventario')
        .select('*');

    if (error) {
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
                rep_fecha_lev: obtenerFechaMexico(),
                rep_estado: 1, // 1 = Pendiente (naranja) - ya asignado
                rep_descripcion: descripcion,
                tec_id: tecnicoAsignado.id,
                rep_fecha_asig_tec: obtenerFechaMexico()
            })
            .select()
            .single();

        if (errorReporte) {
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
                return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener reportes pendientes para admins/técnicos
export const obtenerReportesPendientes = async (req, res) => {
    try {
        const tipoUsuario = req.session.perfilId;
        const userId = req.session.userId;

        if (!tipoUsuario || !userId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        const { data: reportes, error } = await supabase
            .schema('RCU')
            .from('reporte')
            .select(`
                id,
                rep_fecha_lev,
                rep_estado,
                tec_id,
                disp_id,
                dispositivo:disp_id(id, disp_serial, disp_codigo, disp_etiqueta, tipo_id, sal_id, inventario:tipo_id(id, inv_nombre))
            `)
            .eq('rep_estado', 1)
            .eq('tec_id', userId)
            .order('rep_fecha_lev', { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reportes pendientes'
            });
        }

        return res.status(200).json({
            success: true,
            reportes: reportes || []
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener reportes completados para admins/técnicos
export const obtenerReportesCompletados = async (req, res) => {
    try {
        const tipoUsuario = req.session.perfilId;
        const userId = req.session.userId;

        if (!tipoUsuario || !userId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        const { data: reportes, error } = await supabase
            .schema('RCU')
            .from('reporte')
            .select(`
                id,
                rep_fecha_res,
                rep_estado,
                tec_id,
                disp_id,
                dispositivo:disp_id(id, disp_serial, disp_codigo, disp_etiqueta, tipo_id, sal_id, inventario:tipo_id(id, inv_nombre))
            `)
            .eq('rep_estado', 2)
            .eq('tec_id', userId)
            .order('rep_fecha_res', { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reportes completados'
            });
        }

        return res.status(200).json({
            success: true,
            reportes: reportes || []
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener detalle de reporte para admins/técnicos
export const obtenerDetalleReporteTecnico = async (req, res) => {
    try {
        const { id } = req.params;
        const tipoUsuario = req.session.perfilId;
        const userId = req.session.userId;

        if (!id || !tipoUsuario || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros inválidos'
            });
        }

        let query = supabase
            .from('reporte')
            .select('*')
            .eq('id', id);

        if (tipoUsuario === 2) {
            query = query.eq('tec_id', userId);
        }

        const { data: reporte, error } = await query.single();

        if (error || !reporte) {
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
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Resolver/Completar un reporte
export const resolverReporte = async (req, res) => {
    try {
        const { id } = req.params;
        const { solucion, fechaResolucion } = req.body;
        const tipoUsuario = req.session.perfilId;
        const userId = req.session.userId;

        // Validaciones
        if (!id || !tipoUsuario || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros inválidos'
            });
        }

        if (!solucion || solucion.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'La solución debe tener al menos 10 caracteres'
            });
        }

        if (!fechaResolucion) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de resolución es requerida'
            });
        }

        // Parsear la fecha como hora de México
        const fechaResolucionIso = parsearFechaMexico(fechaResolucion);
        const fechaResolucionDate = new Date(fechaResolucionIso);

        if (isNaN(fechaResolucionDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Fecha de resolución inválida'
            });
        }

        // Verificar que el reporte exista y esté asignado al técnico (si es técnico)
        let query = supabase
            .from('reporte')
            .select('*')
            .eq('id', id)
            .eq('rep_estado', 1); // Solo reportes pendientes

        if (tipoUsuario === 2) { // Si es técnico, debe ser su reporte
            query = query.eq('tec_id', userId);
        }

        const { data: reporte, error: errorReporte } = await query.single();

        if (errorReporte || !reporte) {
            return res.status(404).json({
                success: false,
                message: 'Reporte no encontrado o ya fue resuelto'
            });
        }

        // Actualizar el reporte
        const { data: reporteActualizado, error: errorUpdate } = await supabase
            .from('reporte')
            .update({
                rep_estado: 2, // Completado
                rep_solucion: solucion.trim(),
                rep_fecha_res: fechaResolucionDate.toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (errorUpdate) {
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar el reporte'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Reporte resuelto exitosamente',
            reporte: reporteActualizado
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener datos del usuario actual
export const obtenerUsuarioActual = async (req, res) => {
    try {
        const userId = req.session.userId;
        const perfilId = req.session.perfilId;

        if (!userId || !perfilId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            usuario: usuario
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener informe del técnico
export const obtenerInformeTecnico = async (req, res) => {
    try {
        const userId = req.session.userId;
        const perfilId = req.session.perfilId;
        const tecnicoId = req.query.id;

        if (!userId || !perfilId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        // Determinar a quién consultar
        // - Técnico (perf 2): solo su propio informe
        // - Admin (perf 1): puede consultar ?id= de cualquier técnico/admin asignable
        let idABuscar = userId;
        if (perfilId === 1 && tecnicoId) {
            idABuscar = tecnicoId.toString().trim();
        } else if (perfilId !== 1 && tecnicoId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver otros técnicos'
            });
        }

        const idABuscarInt = parseInt(idABuscar, 10);
        if (!idABuscarInt || Number.isNaN(idABuscarInt)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }

        // Validar usuario objetivo (técnico o admin activo)
        const { data: usuarioObjetivo, error: errorUsuario } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('*')
            .eq('id', idABuscarInt)
            .in('perf_tipo', [1, 2])
            .maybeSingle();

        if (errorUsuario) {
            return res.status(400).json({ success: false, message: errorUsuario.message || 'Error al consultar usuario' });
        }

        if (!usuarioObjetivo) {
            return res.status(404).json({ success: false, message: 'Técnico no encontrado' });
        }

        if (usuarioObjetivo.est_tipo === 2) {
            return res.status(403).json({ success: false, message: 'Usuario dado de baja. Acceso denegado.' });
        }

        // Obtener reportes asignados a ese usuario (como técnico/admin)
        const { data: reportes, error: errorReportes } = await supabase
            .schema('RCU')
            .from('reporte')
            .select('*')
            .eq('tec_id', idABuscarInt)
            .order('rep_fecha_res', { ascending: false });

        if (errorReportes) {
            return res.status(400).json({ success: false, message: errorReportes.message || 'Error al obtener reportes' });
        }

        const total = (reportes || []).length;
        const pendientes = (reportes || []).filter(r => r.rep_estado === 1).length;
        const completados = (reportes || []).filter(r => r.rep_estado === 2).length;

        return res.status(200).json({
            success: true,
            informe: {
                tecnico: usuarioObjetivo,
                estadisticas: {
                    total,
                    pendientes,
                    completados
                },
                reportes: reportes || []
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============= CRUD ALUMNOS =============
export const buscarAlumno = async (req, res) => {
    try {
        const { boleta } = req.body;

        if (!boleta) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, ingrese una boleta'
            });
        }

        // Validación con regex
        const regexBoleta = /^[0-9]{10}$/;
        const boletaTrim = boleta.toString().trim();

        if (!boletaTrim) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, ingrese una boleta'
            });
        }

        if (!regexBoleta.test(boletaTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La boleta debe contener exactamente 10 dígitos'
            });
        }

        const parseBoleta = parseInt(boletaTrim);

        // Buscar el alumno en la base de datos
        const { data: alumno, error } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('*')
            .eq('id', parseBoleta)
            .eq('perf_tipo', 3)
            .maybeSingle();

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al buscar el alumno'
            });
        }

        if (!alumno) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un alumno con esa boleta'
            });
        }

        return res.status(200).json({
            success: true,
            alumno: alumno
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const crearAlumno = async (req, res) => {
    try {
        const { boleta, nombre, apellido_paterno, apellido_materno, correo, password } = req.body;

        // Validar que todos los campos estén presentes
        if (!boleta || !nombre || !apellido_paterno || !apellido_materno || !correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validaciones con regex
        const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
        const regexBoleta = /^[0-9]{10}$/;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexPasswordLength = /^.{8,25}$/;
        const regexPasswordHasLetter = /[A-Za-z]/;
        const regexPasswordHasNumber = /[0-9]/;

        const nombreTrim = nombre.trim();
        const apTrim = apellido_paterno.trim();
        const amTrim = apellido_materno.trim();
        const boletaTrim = boleta.trim();
        const correoTrim = correo.trim();
        const passwordTrim = password.trim();

        if (!nombreTrim || !apTrim || !amTrim || !boletaTrim || !correoTrim || !passwordTrim) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        if (!regexNombre.test(nombreTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El nombre solo puede contener letras y espacios'
            });
        }

        if (!regexNombre.test(apTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El apellido paterno solo puede contener letras y espacios'
            });
        }

        if (!regexNombre.test(amTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El apellido materno solo puede contener letras y espacios'
            });
        }

        if (!regexBoleta.test(boletaTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La boleta debe contener exactamente 10 dígitos'
            });
        }

        if (!regexEmail.test(correoTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El correo no es válido'
            });
        }

        if (!regexPasswordLength.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener entre 8 y 25 caracteres'
            });
        }

        if (!regexPasswordHasLetter.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos una letra'
            });
        }

        if (!regexPasswordHasNumber.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos un número'
            });
        }

        const parseBoleta = parseInt(boletaTrim);
        const correoLower = correoTrim.toLowerCase();

        // Verificar si la boleta ya existe
        const { data: existingUser, error: checkError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('id')
            .eq('id', parseBoleta)
            .maybeSingle();

        if (checkError) {
            return res.status(400).json({
                success: false,
                message: checkError.message || 'Error al verificar la boleta'
            });
        }

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'La boleta ya está registrada'
            });
        }

        // Verificar si el correo ya existe
        const { data: existingEmail, error: emailError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('id')
            .ilike('usr_correo', correoLower)
            .maybeSingle();

        if (emailError) {
            return res.status(400).json({
                success: false,
                message: emailError.message || 'Error al verificar el correo'
            });
        }

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        // Insertar el nuevo alumno
        const insertData = {
            id: parseBoleta,
            usr_nombre: nombreTrim,
            usr_ap: apTrim,
            usr_am: amTrim,
            usr_correo: correoLower,
            usr_pass: passwordTrim,
            perf_tipo: 3,
            est_tipo: 1
        };

        const { data, error: insertError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .insert(insertData)
            .select()
            .single();

        if (insertError) {
            return res.status(400).json({
                success: false,
                message: insertError.message || 'No se pudo crear el alumno'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Alumno creado exitosamente',
            alumno: data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const actualizarAlumno = async (req, res) => {
    try {
        const { boleta, nombre, apellido_paterno, apellido_materno, correo, password, estado } = req.body;

        if (!boleta || !nombre || !apellido_paterno || !apellido_materno || !correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validaciones con regex
        const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexPasswordLength = /^.{8,25}$/;
        const regexPasswordHasLetter = /[A-Za-z]/;
        const regexPasswordHasNumber = /[0-9]/;

        const nombreTrim = nombre.trim();
        const apTrim = apellido_paterno.trim();
        const amTrim = apellido_materno.trim();
        const correoTrim = correo.trim();
        const passwordTrim = password.trim();

        if (!nombreTrim || !apTrim || !amTrim || !correoTrim || !passwordTrim) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        if (!regexNombre.test(nombreTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El nombre solo puede contener letras y espacios'
            });
        }

        if (!regexNombre.test(apTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El apellido paterno solo puede contener letras y espacios'
            });
        }

        if (!regexNombre.test(amTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El apellido materno solo puede contener letras y espacios'
            });
        }

        if (!regexEmail.test(correoTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El correo no es válido'
            });
        }

        if (!regexPasswordLength.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener entre 8 y 25 caracteres'
            });
        }

        if (!regexPasswordHasLetter.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos una letra'
            });
        }

        if (!regexPasswordHasNumber.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos un número'
            });
        }

        const correoLower = correoTrim.toLowerCase();

        // Obtener el alumno actual para comparar correo
        const { data: alumnoActual, error: getError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('usr_correo')
            .eq('id', boleta)
            .eq('perf_tipo', 3)
            .maybeSingle();

        if (getError || !alumnoActual) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el alumno'
            });
        }

        // Verificar si el correo ya existe en otro usuario
        if (correoLower !== alumnoActual.usr_correo.toLowerCase()) {
            const { data: existingEmail, error: emailError } = await supabase
                .schema('RCU')
                .from('usuarios')
                .select('id')
                .ilike('usr_correo', correoLower)
                .neq('id', boleta)
                .maybeSingle();

            if (emailError) {
                return res.status(400).json({
                    success: false,
                    message: emailError.message || 'Error al verificar el correo'
                });
            }

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo ya está registrado por otro usuario'
                });
            }
        }

        // Actualizar el alumno
        const updateData = {
            usr_nombre: nombreTrim,
            usr_ap: apTrim,
            usr_am: amTrim,
            usr_correo: correoLower,
            usr_pass: passwordTrim,
            est_tipo: parseInt(estado)
        };

        const { data, error: updateError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .update(updateData)
            .eq('id', boleta)
            .eq('perf_tipo', 3)
            .select()
            .single();

        if (updateError) {
            return res.status(400).json({
                success: false,
                message: updateError.message || 'No se pudo actualizar el alumno'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Alumno actualizado exitosamente',
            alumno: data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const eliminarAlumno = async (req, res) => {
    try {
        const { boleta, identificador, password } = req.body;

        if (!boleta || !identificador || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validaciones
        const regexId = /^[0-9]{1,20}$/;
        const regexPassword = /^.{8,25}$/;

        const idTrim = identificador.toString().trim();
        const passwordTrim = password.trim();

        if (!idTrim || !passwordTrim) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        if (!regexId.test(idTrim)) {
            return res.status(400).json({
                success: false,
                message: 'Identificador inválido'
            });
        }

        if (!regexPassword.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña inválida'
            });
        }

        const parseId = parseInt(idTrim);

        // Verificar que haya sesión activa
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        // Obtener datos del admin desde la sesión
        const { data: adminData, error: adminError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('id, usr_pass')
            .eq('id', req.session.userId)
            .eq('perf_tipo', 1)
            .maybeSingle();

        if (adminError || !adminData) {
            return res.status(401).json({
                success: false,
                message: 'Error al verificar credenciales'
            });
        }

        // Verificar que el identificador y contraseña coincidan con el admin actual (equivalente a data.id y data.usr_pass)
        if (parseId !== adminData.id || passwordTrim !== adminData.usr_pass) {
            return res.status(401).json({
                success: false,
                message: 'Identificador o contraseña incorrectos'
            });
        }

        // Cambiar estado del alumno a Baja (est_tipo: 2)
        const { error: updateError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .update({ est_tipo: 2 })
            .eq('id', boleta)
            .eq('perf_tipo', 3);

        if (updateError) {
            return res.status(400).json({
                success: false,
                message: updateError.message || 'No se pudo eliminar el alumno'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Alumno eliminado exitosamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============= CRUD TÉCNICOS =============
export const buscarTecnico = async (req, res) => {
    try {
        const { id_tecnico } = req.body;

        if (!id_tecnico) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, ingrese un ID'
            });
        }

        // Validación con regex
        const regexId = /^[0-9]{10}$/;
        const idTrim = id_tecnico.toString().trim();

        if (!idTrim) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, ingrese un ID'
            });
        }

        if (!regexId.test(idTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El ID debe contener exactamente 10 dígitos'
            });
        }

        const parseId = parseInt(idTrim);

        // Buscar el técnico en la base de datos
        const { data: tecnico, error } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('*')
            .eq('id', parseId)
            .eq('perf_tipo', 2)
            .maybeSingle();

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al buscar el técnico'
            });
        }

        if (!tecnico) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró un técnico con ese ID'
            });
        }

        return res.status(200).json({
            success: true,
            tecnico: tecnico
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const crearTecnico = async (req, res) => {
    try {
        const { id_tecnico, nombre, apellido_paterno, apellido_materno, correo, password } = req.body;

        // Validar que todos los campos estén presentes
        if (!id_tecnico || !nombre || !apellido_paterno || !apellido_materno || !correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validaciones con regex
        const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
        const regexId = /^[0-9]{10}$/;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexPasswordLength = /^.{8,25}$/;
        const regexPasswordHasLetter = /[A-Za-z]/;
        const regexPasswordHasNumber = /[0-9]/;

        const nombreTrim = nombre.trim();
        const apTrim = apellido_paterno.trim();
        const amTrim = apellido_materno.trim();
        const idTrim = id_tecnico.trim();
        const correoTrim = correo.trim();
        const passwordTrim = password.trim();

        if (!nombreTrim || !apTrim || !amTrim || !idTrim || !correoTrim || !passwordTrim) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        if (!regexNombre.test(nombreTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El nombre solo puede contener letras y espacios'
            });
        }

        if (!regexNombre.test(apTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El apellido paterno solo puede contener letras y espacios'
            });
        }

        if (!regexNombre.test(amTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El apellido materno solo puede contener letras y espacios'
            });
        }

        if (!regexId.test(idTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El ID solo puede contener números'
            });
        }

        if (!regexEmail.test(correoTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El correo no es válido'
            });
        }

        if (!regexPasswordLength.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener entre 8 y 25 caracteres'
            });
        }

        if (!regexPasswordHasLetter.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos una letra'
            });
        }

        if (!regexPasswordHasNumber.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos un número'
            });
        }

        const parseId = parseInt(idTrim);
        const correoLower = correoTrim.toLowerCase();

        // Verificar si el ID ya existe
        const { data: existingUser, error: checkError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('id')
            .eq('id', parseId)
            .maybeSingle();

        if (checkError) {
            return res.status(400).json({
                success: false,
                message: checkError.message || 'Error al verificar el ID'
            });
        }

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El ID ya está registrado'
            });
        }

        // Verificar si el correo ya existe
        const { data: existingEmail, error: emailError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('id')
            .ilike('usr_correo', correoLower)
            .maybeSingle();

        if (emailError) {
            return res.status(400).json({
                success: false,
                message: emailError.message || 'Error al verificar el correo'
            });
        }

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        // Insertar el nuevo técnico
        const insertData = {
            id: parseId,
            usr_nombre: nombreTrim,
            usr_ap: apTrim,
            usr_am: amTrim,
            usr_correo: correoLower,
            usr_pass: passwordTrim,
            perf_tipo: 2,
            est_tipo: 1
        };

        const { data, error: insertError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .insert(insertData)
            .select()
            .single();

        if (insertError) {
            return res.status(400).json({
                success: false,
                message: insertError.message || 'No se pudo crear el técnico'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Técnico creado exitosamente',
            tecnico: data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const actualizarTecnico = async (req, res) => {
    try {
        const { id_tecnico, nombre, apellido_paterno, apellido_materno, correo, password, estado } = req.body;

        if (!id_tecnico || !nombre || !apellido_paterno || !apellido_materno || !correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validaciones con regex
        const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexPasswordLength = /^.{8,25}$/;
        const regexPasswordHasLetter = /[A-Za-z]/;
        const regexPasswordHasNumber = /[0-9]/;

        const nombreTrim = nombre.trim();
        const apTrim = apellido_paterno.trim();
        const amTrim = apellido_materno.trim();
        const correoTrim = correo.trim();
        const passwordTrim = password.trim();

        if (!nombreTrim || !apTrim || !amTrim || !correoTrim || !passwordTrim) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        if (!regexNombre.test(nombreTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El nombre solo puede contener letras y espacios'
            });
        }

        if (!regexNombre.test(apTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El apellido paterno solo puede contener letras y espacios'
            });
        }

        if (!regexNombre.test(amTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El apellido materno solo puede contener letras y espacios'
            });
        }

        if (!regexEmail.test(correoTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El correo no es válido'
            });
        }

        if (!regexPasswordLength.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener entre 8 y 25 caracteres'
            });
        }

        if (!regexPasswordHasLetter.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos una letra'
            });
        }

        if (!regexPasswordHasNumber.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe contener al menos un número'
            });
        }

        const correoLower = correoTrim.toLowerCase();

        // Obtener el técnico actual para comparar correo
        const { data: tecnicoActual, error: getError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('usr_correo')
            .eq('id', id_tecnico)
            .eq('perf_tipo', 2)
            .maybeSingle();

        if (getError || !tecnicoActual) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el técnico'
            });
        }

        // Verificar si el correo ya existe en otro usuario
        if (correoLower !== tecnicoActual.usr_correo.toLowerCase()) {
            const { data: existingEmail, error: emailError } = await supabase
                .schema('RCU')
                .from('usuarios')
                .select('id')
                .ilike('usr_correo', correoLower)
                .neq('id', id_tecnico)
                .maybeSingle();

            if (emailError) {
                return res.status(400).json({
                    success: false,
                    message: emailError.message || 'Error al verificar el correo'
                });
            }

            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo ya está registrado por otro usuario'
                });
            }
        }

        // Actualizar el técnico
        const updateData = {
            usr_nombre: nombreTrim,
            usr_ap: apTrim,
            usr_am: amTrim,
            usr_correo: correoLower,
            usr_pass: passwordTrim,
            est_tipo: parseInt(estado)
        };

        const { data, error: updateError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .update(updateData)
            .eq('id', id_tecnico)
            .eq('perf_tipo', 2)
            .select()
            .single();

        if (updateError) {
            return res.status(400).json({
                success: false,
                message: updateError.message || 'No se pudo actualizar el técnico'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Técnico actualizado exitosamente',
            tecnico: data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const eliminarTecnico = async (req, res) => {
    try {
        const { id_tecnico, identificador, password } = req.body;

        if (!id_tecnico || !identificador || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        // Validaciones
        const regexId = /^[0-9]{1,20}$/;
        const regexPassword = /^.{8,25}$/;

        const idTrim = identificador.toString().trim();
        const passwordTrim = password.trim();

        if (!idTrim || !passwordTrim) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        if (!regexId.test(idTrim)) {
            return res.status(400).json({
                success: false,
                message: 'Identificador inválido'
            });
        }

        if (!regexPassword.test(passwordTrim)) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña inválida'
            });
        }

        const parseId = parseInt(idTrim);

        // Verificar que haya sesión activa
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'No hay sesión activa'
            });
        }

        // Obtener datos del admin desde la sesión
        const { data: adminData, error: adminError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .select('id, usr_pass')
            .eq('id', req.session.userId)
            .eq('perf_tipo', 1)
            .maybeSingle();

        if (adminError || !adminData) {
            return res.status(401).json({
                success: false,
                message: 'Error al verificar credenciales'
            });
        }

        // Verificar que el identificador y contraseña coincidan con el admin actual
        if (parseId !== adminData.id || passwordTrim !== adminData.usr_pass) {
            return res.status(401).json({
                success: false,
                message: 'Identificador o contraseña incorrectos'
            });
        }

        // Cambiar estado del técnico a Baja (est_tipo: 2)
        const { error: updateError } = await supabase
            .schema('RCU')
            .from('usuarios')
            .update({ est_tipo: 2 })
            .eq('id', id_tecnico)
            .eq('perf_tipo', 2);

        if (updateError) {
            return res.status(400).json({
                success: false,
                message: updateError.message || 'No se pudo eliminar el técnico'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Técnico eliminado exitosamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ============= CRUD DISPOSITIVOS =============
export const buscarDispositivo = async (req, res) => {
    try {
        const { serial } = req.body;

        if (!serial) {
            return res.status(400).json({
                success: false,
                message: 'El serial es requerido'
            });
        }

        const serialTrim = serial.toString().trim();
        const regexNum = /^[0-9]{1,20}$/;

        if (!regexNum.test(serialTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El serial solo puede contener números'
            });
        }

        const { data: dispositivo, error } = await supabase
            .schema('RCU')
            .from('dispositivo')
            .select('*')
            .eq('disp_serial', parseInt(serialTrim, 10))
            .maybeSingle();

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al buscar dispositivo'
            });
        }

        if (!dispositivo) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el dispositivo'
            });
        }

        return res.status(200).json({
            success: true,
            dispositivo: dispositivo
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const crearDispositivo = async (req, res) => {
    try {
        const { serial, codigo, etiqueta, tipo_id, tipo_inventario, sal_id, salon, estado } = req.body;

        const serialTrim = (serial ?? '').toString().trim();
        const codigoTrim = (codigo ?? '').toString().trim();
        const etiquetaTrim = (etiqueta ?? '').toString().trim();
        const tipo = tipo_id || tipo_inventario;
        const salonId = sal_id || salon;

        const regexNum = /^[0-9]+$/;

        if (!serialTrim || !codigoTrim || !etiquetaTrim || !tipo || !salonId) {
            return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
        }

        if (!regexNum.test(serialTrim)) {
            return res.status(400).json({ success: false, message: 'El serial solo puede contener números' });
        }

        if (!regexNum.test(codigoTrim)) {
            return res.status(400).json({ success: false, message: 'El código solo puede contener números' });
        }

        // Verificar duplicado de serial
        const { data: existente, error: errorDup } = await supabase
            .schema('RCU')
            .from('dispositivo')
            .select('id')
            .eq('disp_serial', parseInt(serialTrim, 10))
            .maybeSingle();

        if (errorDup) {
            return res.status(400).json({ success: false, message: errorDup.message || 'Error al validar duplicados' });
        }

        if (existente) {
            return res.status(409).json({ success: false, message: 'El serial ya está registrado' });
        }

        const insertData = {
            disp_serial: parseInt(serialTrim, 10),
            disp_codigo: parseInt(codigoTrim, 10),
            disp_etiqueta: etiquetaTrim,
            tipo_id: tipo,
            sal_id: salonId,
            disp_estado_actv: estado === '1' || estado === 1 || estado === true || estado === 'true' || estado === undefined
        };

        const { data, error } = await supabase
            .schema('RCU')
            .from('dispositivo')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al crear el dispositivo'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Dispositivo creado exitosamente',
            dispositivo: data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const actualizarDispositivo = async (req, res) => {
    try {
        const { id, serial, codigo, etiqueta, tipo_id, tipo_inventario, sal_id, salon, estado_activo } = req.body;

        const idInt = parseInt(id, 10);
        if (!idInt || Number.isNaN(idInt)) {
            return res.status(400).json({
                success: false,
                message: 'El ID del dispositivo es inválido'
            });
        }

        const serialTrim = (serial ?? '').toString().trim();
        const codigoTrim = (codigo ?? '').toString().trim();
        const etiquetaTrim = (etiqueta ?? '').toString().trim();
        const tipo = tipo_id || tipo_inventario;
        const salonId = sal_id || salon;

        const regexNum = /^[0-9]+$/;

        if (!serialTrim || !codigoTrim || !etiquetaTrim || !tipo || !salonId) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        if (!regexNum.test(serialTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El serial solo puede contener números'
            });
        }

        if (!regexNum.test(codigoTrim)) {
            return res.status(400).json({
                success: false,
                message: 'El código solo puede contener números'
            });
        }

        // Verificar duplicado de serial (excluyendo el actual)
        const { data: existente, error: errorDup } = await supabase
            .schema('RCU')
            .from('dispositivo')
            .select('id')
            .eq('disp_serial', parseInt(serialTrim, 10))
            .neq('id', idInt)
            .maybeSingle();

        if (errorDup) {
            return res.status(400).json({ success: false, message: errorDup.message || 'Error al validar duplicados' });
        }

        if (existente) {
            return res.status(409).json({ success: false, message: 'El serial ya está registrado' });
        }

        const { data, error } = await supabase
            .schema('RCU')
            .from('dispositivo')
            .update({
                disp_serial: parseInt(serialTrim, 10),
                disp_codigo: parseInt(codigoTrim, 10),
                disp_etiqueta: etiquetaTrim,
                tipo_id: tipo,
                sal_id: salonId,
                disp_estado_actv: estado_activo === true || estado_activo === 1 || estado_activo === '1'
            })
            .eq('id', idInt)
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar el dispositivo'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Dispositivo actualizado exitosamente',
            dispositivo: data
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

export const obtenerDispositivosInforme = async (req, res) => {
    try {
        const { sal_id } = req.query;

        if (!sal_id) {
            return res.status(400).json({
                success: false,
                message: 'El ID del salón es requerido'
            });
        }

        const { data: dispositivos, error } = await supabase
            .schema('RCU')
            .from('dispositivo')
            .select('*')
            .eq('sal_id', parseInt(sal_id, 10))
            .order('id', { ascending: true });

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Error al obtener dispositivos'
            });
        }

        const total = dispositivos?.length || 0;
        const activos = dispositivos?.filter(d => d.disp_estado_actv).length || 0;
        const inactivos = dispositivos?.filter(d => !d.disp_estado_actv).length || 0;

        return res.status(200).json({
            success: true,
            dispositivos: dispositivos || [],
            estadisticas: {
                total,
                activos,
                inactivos
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};
