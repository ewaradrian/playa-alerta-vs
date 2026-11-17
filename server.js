/**
 * =============================================================
 * ARCHIVO: server.js
 * PROYECTO: Playa Alerta
 * DESCRIPCIÓN: Servidor Express y API REST compatible con:
 *   - Supabase (PostgreSQL / PostgREST) [Producción & Vercel]
 *   - Aiven MySQL (Fallback / Legacy)
 *   - Entorno Serverless (Vercel) y Servidor Node local
 * =============================================================
 */

'use strict';

/* Carga variables de entorno locales desde .env */
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

/* ── Middlewares globales ─────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


/* ── 1. Inicialización de Base de Datos ────────────────────── */

/**
 * Normaliza y sanea la URL de Supabase para evitar errores de validación
 * y paths duplicados como '/rest/v1'. Extrae siempre el origen puro 'https://<ref>.supabase.co'.
 */
function limpiarUrlSupabase(url) {
    if (!url || typeof url !== 'string') return null;
    let limpia = url.trim().replace(/^['"]+|['"]+$/g, '');
    if (!limpia) return null;

    // Si el usuario pegó la cadena de conexión postgresql://postgres:...@db.ref.supabase.co:5432/...
    const matchDb = limpia.match(/db\.([a-z0-9_-]+)\.supabase\.co/i);
    if (matchDb && matchDb[1]) {
        return `https://${matchDb[1]}.supabase.co`;
    }

    if (!limpia.startsWith('http://') && !limpia.startsWith('https://')) {
        limpia = 'https://' + limpia;
    }

    try {
        const parsed = new URL(limpia);
        let host = parsed.hostname;
        // Si el hostname empieza por db., quitarlo
        if (host.startsWith('db.')) {
            host = host.replace(/^db\./, '');
        }
        return `https://${host}`;
    } catch (e) {
        return limpia.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
    }
}

function limpiarClaveSupabase(clave) {
    if (!clave || typeof clave !== 'string') return null;
    return clave.trim().replace(/^['"]+|['"]+$/g, '');
}

const rawSupabaseUrl = process.env.SUPABASE_URL;
const rawSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabaseUrl = limpiarUrlSupabase(rawSupabaseUrl);
const supabaseKey = limpiarClaveSupabase(rawSupabaseKey);

let supabase = null;
let mysqlPool = null;

if (supabaseUrl && supabaseKey) {
    /* MODO PRIMARIO: Supabase */
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('[DB] Conectado a Supabase en:', supabaseUrl);
    } catch (err) {
        console.error('[DB] Error al inicializar cliente de Supabase:', err.message);
    }
} else if (process.env.DB_HOST && process.env.DB_PASSWORD) {
    /* MODO SECUNDARIO (Fallback): Aiven MySQL */
    const mysql = require('mysql2/promise');
    mysqlPool = mysql.createPool({
        host:               process.env.DB_HOST,
        port:               Number(process.env.DB_PORT) || 28776,
        database:           process.env.DB_NAME || 'defaultdb',
        user:               process.env.DB_USER || 'avnadmin',
        password:           process.env.DB_PASSWORD,
        ssl:                { rejectUnauthorized: false }, /* Permite el certificado SSL de Aiven */
        waitForConnections: true,
        connectionLimit:    10,
        queueLimit:         0
    });
    console.log('[DB] Conectado a MySQL (modo fallback).');
} else {
    console.warn('[DB] ADVERTENCIA: No se detectaron variables de Supabase (SUPABASE_URL, SUPABASE_ANON_KEY) ni de MySQL.');
}


/* ── Helpers para Supabase ────────────────────────────────── */

/**
 * obtenerIdCategoriaSupabase(nombre)
 * Busca el ID de la categoría en la tabla "Categoria" de Supabase.
 * Si no existe, la crea con visible = true.
 */
async function obtenerIdCategoriaSupabase(nombre) {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('Categoria')
        .select('id_categoria')
        .ilike('nombre', nombre)
        .maybeSingle();

    if (data && data.id_categoria) {
        return data.id_categoria;
    }

    const { data: nueva, error: errInsert } = await supabase
        .from('Categoria')
        .insert([{ nombre, visible: true }])
        .select('id_categoria')
        .single();

    if (errInsert) {
        console.warn('[Supabase] Error al crear categoría:', errInsert.message);
        return 1; // Fallback al primer ID
    }
    return nueva.id_categoria;
}

/**
 * obtenerIdZonaSupabase()
 * Busca la primera zona en "ZonaPlaya" o crea una por defecto.
 */
async function obtenerIdZonaSupabase() {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('ZonaPlaya')
        .select('id_zona')
        .order('id_zona', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (data && data.id_zona) {
        return data.id_zona;
    }

    const { data: nueva, error: errInsert } = await supabase
        .from('ZonaPlaya')
        .insert([{ colonia: 'Playa del Carmen Centro', codigo_postal: '77710' }])
        .select('id_zona')
        .single();

    if (errInsert) {
        console.warn('[Supabase] Error al crear zona por defecto:', errInsert.message);
        return 1;
    }
    return nueva.id_zona;
}


/* ── Helpers para MySQL (Fallback) ────────────────────────── */
async function obtenerIdCategoriaMySQL(nombre, conn) {
    const [rows] = await conn.execute(
        'SELECT id_categoria FROM Categoria WHERE nombre = ? LIMIT 1',
        [nombre]
    );
    if (rows.length > 0) return rows[0].id_categoria;
    const [result] = await conn.execute(
        'INSERT INTO Categoria (nombre, visible) VALUES (?, TRUE)',
        [nombre]
    );
    return result.insertId;
}

async function obtenerIdZonaMySQL(conn) {
    const [rows] = await conn.execute(
        'SELECT id_zona FROM ZonaPlaya ORDER BY id_zona ASC LIMIT 1'
    );
    if (rows.length > 0) return rows[0].id_zona;
    const [result] = await conn.execute(
        'INSERT INTO ZonaPlaya (colonia, codigo_postal) VALUES (?, ?)',
        ['Playa del Carmen Centro', '77710']
    );
    return result.insertId;
}


/* ══════════════════════════════════════════════════════════
   RUTAS DE LA API REST (Router modular)
   ══════════════════════════════════════════════════════════ */
const apiRouter = express.Router();

/* ── GET /api/reportes ────────────────────────────────────── */
apiRouter.get('/reportes', async (req, res) => {
    // 1. Intentar con Supabase
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('ReporteAnonimo')
                .select(`
                    id_anonimo,
                    titulo,
                    descripcion,
                    latitud,
                    longitud,
                    estado,
                    created_at,
                    id_categoria,
                    Categoria ( nombre )
                `)
                .order('id_anonimo', { ascending: false })
                .limit(200);

            if (error) {
                console.error('[Supabase] Error al consultar reportes:', error.message);
                throw error;
            }

            const reportes = (data || []).map(r => ({
                id_anonimo:  r.id_anonimo,
                titulo:      r.titulo || 'Sin título',
                descripcion: r.descripcion || '',
                latitud:     r.latitud,
                longitud:    r.longitud,
                estado:      r.estado || 'activo',
                created_at:  r.created_at || null,
                categoria:   (r.Categoria && r.Categoria.nombre)
                    ? r.Categoria.nombre
                    : (r.id_categoria === 1 ? 'Tráfico' : 'Incidencia Vial')
            }));

            return res.json({ ok: true, reportes });
        } catch (error) {
            console.error('[API Supabase] Falló la consulta:', error.message);
        }
    }

    // 2. Fallback a MySQL si Supabase no está configurado
    if (mysqlPool) {
        let conn;
        try {
            conn = await mysqlPool.getConnection();
            const [rows] = await conn.execute(
                `SELECT r.id_anonimo, r.titulo, r.descripcion, r.latitud, r.longitud, r.estado,
                        c.nombre AS categoria
                 FROM ReporteAnonimo r
                 LEFT JOIN Categoria c ON r.id_categoria = c.id_categoria
                 ORDER BY r.id_anonimo DESC
                 LIMIT 100`
            );
            return res.json({ ok: true, reportes: rows });
        } catch (error) {
            console.error('[MySQL Fallback] Error:', error.message);
            return res.status(500).json({ ok: false, mensaje: 'Error al consultar reportes en BD.' });
        } finally {
            if (conn) conn.release();
        }
    }

    return res.status(503).json({
        ok: false,
        mensaje: 'Base de datos no configurada. Configura SUPABASE_URL y SUPABASE_ANON_KEY en Vercel/.env'
    });
});

/* ── POST /api/reportes ───────────────────────────────────── */
apiRouter.post('/reportes', async (req, res) => {
    const { tipo, titulo, descripcion, latitud, longitud, estado } = req.body;

    if (!tipo || !latitud || !longitud) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Faltan campos obligatorios: tipo, latitud, longitud.'
        });
    }

    const mapaCategoria = {
        trafico:    'Tráfico',
        incidencia: 'Incidencia Vial'
    };

    const nombreCategoria = mapaCategoria[tipo] || 'Incidencia Vial';

    const estadoNormalizado = (estado === 'Y' || estado === 'activo')
        ? 'activo'
        : (estado === 'N' || estado === 'resuelto')
            ? 'resuelto'
            : (estado || 'activo');

    const ipOrigen =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || 'desconocida';

    // 1. Guardar en Supabase
    if (supabase) {
        try {
            const [idCategoria, idZona] = await Promise.all([
                obtenerIdCategoriaSupabase(nombreCategoria),
                obtenerIdZonaSupabase()
            ]);

            const nuevoRegistro = {
                id_categoria: idCategoria || 1,
                id_zona:      idZona || 1,
                titulo:       (titulo || '').substring(0, 120),
                descripcion:  (descripcion || '').substring(0, 500),
                latitud:      String(latitud).substring(0, 20),
                longitud:     String(longitud).substring(0, 20),
                estado:       estadoNormalizado.substring(0, 30),
                ip_origen:    ipOrigen
            };

            const { data, error } = await supabase
                .from('ReporteAnonimo')
                .insert([nuevoRegistro])
                .select('id_anonimo')
                .single();

            if (error) {
                console.error('[Supabase] Error en insert:', error.message);
                throw error;
            }

            console.log(`[API Supabase] Reporte guardado → ID ${data.id_anonimo}`);
            return res.status(201).json({ ok: true, id: data.id_anonimo });

        } catch (error) {
            console.error('[API Supabase] Error al guardar reporte:', error.message);
            return res.status(500).json({
                ok: false,
                mensaje: `Error al guardar en Supabase: ${error.message}`
            });
        }
    }

    // 2. Fallback a MySQL
    if (mysqlPool) {
        let conn;
        try {
            conn = await mysqlPool.getConnection();
            const [idCategoria, idZona] = await Promise.all([
                obtenerIdCategoriaMySQL(nombreCategoria, conn),
                obtenerIdZonaMySQL(conn)
            ]);

            const [result] = await conn.execute(
                `INSERT INTO ReporteAnonimo
                    (id_categoria, id_zona, titulo, descripcion,
                     latitud, longitud, estado, ip_origen)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    idCategoria,
                    idZona,
                    (titulo || '').substring(0, 120),
                    (descripcion || '').substring(0, 500),
                    String(latitud).substring(0, 20),
                    String(longitud).substring(0, 20),
                    estadoNormalizado.substring(0, 30),
                    ipOrigen
                ]
            );

            return res.status(201).json({ ok: true, id: result.insertId });
        } catch (error) {
            console.error('[MySQL Fallback] Error en insert:', error.message);
            return res.status(500).json({ ok: false, mensaje: 'Error al guardar en base de datos.' });
        } finally {
            if (conn) conn.release();
        }
    }

    return res.status(503).json({
        ok: false,
        mensaje: 'Sin conexión a base de datos configurada.'
    });
});


/* ── PATCH /api/reportes/:id/estado ──────────────────────── */
/**
 * Actualiza el campo "estado" de un reporte existente.
 * Body esperado: { "estado": "activo" | "resuelto" }
 */
apiRouter.patch('/reportes/:id/estado', async (req, res) => {
    const id       = parseInt(req.params.id, 10);
    let { estado } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, mensaje: 'ID de reporte inválido.' });
    }

    /* Normaliza alias Y / N hacia activo / resuelto */
    if (estado === 'Y') estado = 'activo';
    if (estado === 'N') estado = 'resuelto';

    const estadosValidos = ['activo', 'resuelto'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
            ok: false,
            mensaje: `Estado inválido. Usa: ${estadosValidos.join(' | ')}`
        });
    }

    /* 1. Actualizar en Supabase */
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('ReporteAnonimo')
                .update({ estado })
                .eq('id_anonimo', id)
                .select();

            if (error) {
                console.error('[Supabase] Error al actualizar estado:', error.message);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn(`[Supabase] RLS o ID inexistente: 0 filas actualizadas para reporte #${id}`);
                return res.status(403).json({
                    ok: false,
                    mensaje: `No se pudo actualizar el reporte #${id}. Las políticas de seguridad (RLS) de Supabase están bloqueando el UPDATE o el reporte no existe. Ejecuta las políticas de UPDATE o usa SUPABASE_SERVICE_ROLE_KEY.`
                });
            }

            console.log(`[API Supabase] Reporte #${id} → estado: ${estado} (filas afectadas: ${data.length})`);
            return res.json({ ok: true, id, estado, filasAfectadas: data.length });

        } catch (error) {
            return res.status(500).json({
                ok: false,
                mensaje: `Error al actualizar en Supabase: ${error.message}`
            });
        }
    }

    /* 2. Fallback: actualizar en MySQL */
    if (mysqlPool) {
        let conn;
        try {
            conn = await mysqlPool.getConnection();
            await conn.execute(
                'UPDATE ReporteAnonimo SET estado = ? WHERE id_anonimo = ?',
                [estado, id]
            );
            return res.json({ ok: true, id, estado });
        } catch (error) {
            console.error('[MySQL Fallback] Error al actualizar estado:', error.message);
            return res.status(500).json({ ok: false, mensaje: 'Error al actualizar en BD.' });
        } finally {
            if (conn) conn.release();
        }
    }

    return res.status(503).json({
        ok: false,
        mensaje: 'Base de datos no configurada.'
    });
});


/* ── POST /api/admin/verify ──────────────────────────────── */
/**
 * Verifica la contraseña del administrador para habilitar el panel de gestión.
 * Contraseña requerida: "VIALIDADES"
 */
apiRouter.post('/admin/verify', (req, res) => {
    const { password } = req.body || {};
    const claveEsperada = 'VIALIDADES';

    if (password && String(password).trim().toUpperCase() === claveEsperada) {
        return res.json({ ok: true, mensaje: 'Acceso autorizado como administrador.' });
    }

    return res.status(401).json({
        ok: false,
        mensaje: 'Contraseña de administrador incorrecta.'
    });
});


/* ── DELETE /api/reportes/:id ─────────────────────────────── */
/**
 * Elimina un reporte por su ID único.
 * Requiere autorización mediante la contraseña "VIALIDADES"
 * (enviada por header 'x-admin-password', body o query).
 */
apiRouter.delete('/reportes/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const passwordHeader = req.headers['x-admin-password'] || req.query.password || req.body?.password;

    if (!id || isNaN(id)) {
        return res.status(400).json({ ok: false, mensaje: 'ID de reporte inválido.' });
    }

    if (!passwordHeader || String(passwordHeader).trim().toUpperCase() !== 'VIALIDADES') {
        return res.status(401).json({
            ok: false,
            mensaje: 'Acceso no autorizado: Contraseña de administrador inválida.'
        });
    }

    /* 1. Eliminar en Supabase */
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('ReporteAnonimo')
                .delete()
                .eq('id_anonimo', id)
                .select();

            if (error) {
                console.error('[Supabase] Error al eliminar reporte:', error.message);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn(`[Supabase] RLS o ID inexistente: 0 filas eliminadas para reporte #${id}`);
                return res.status(403).json({
                    ok: false,
                    mensaje: `No se pudo eliminar el reporte #${id}. Las políticas de seguridad (RLS) de Supabase están bloqueando el DELETE o el reporte no existe. Ejecuta las políticas de DELETE en Supabase o usa SUPABASE_SERVICE_ROLE_KEY.`
                });
            }

            console.log(`[API Supabase] Reporte #${id} eliminado (filas eliminadas: ${data.length}).`);
            return res.json({ ok: true, mensaje: `Reporte #${id} eliminado correctamente.`, filasEliminadas: data.length });

        } catch (error) {
            console.error('[API Supabase] Error al eliminar:', error.message);
            return res.status(500).json({
                ok: false,
                mensaje: `Error al eliminar reporte en Supabase: ${error.message}`
            });
        }
    }

    /* 2. Fallback a MySQL */
    if (mysqlPool) {
        let conn;
        try {
            conn = await mysqlPool.getConnection();
            await conn.execute('DELETE FROM ReporteAnonimo WHERE id_anonimo = ?', [id]);
            console.log(`[MySQL Fallback] Reporte #${id} eliminado.`);
            return res.json({ ok: true, mensaje: `Reporte #${id} eliminado correctamente.` });
        } catch (error) {
            console.error('[MySQL Fallback] Error al eliminar:', error.message);
            return res.status(500).json({ ok: false, mensaje: 'Error al eliminar reporte en BD.' });
        } finally {
            if (conn) conn.release();
        }
    }

    return res.status(503).json({
        ok: false,
        mensaje: 'Base de datos no configurada.'
    });
});


/* ── Montar rutas API en /api y en la raíz (compatibilidad Vercel) ── */
app.use('/api', apiRouter);

/* ── Ruta principal para navegador local ──────────────────── */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


/* ── Arranque en servidor local (No se ejecuta en Vercel) ──── */
const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[Playa Alerta] Servidor corriendo en http://localhost:${PORT}`);
        console.log(`[Playa Alerta] API disponible en  http://localhost:${PORT}/api/reportes`);
    });
}

/* Exportar app para despliegue Serverless en Vercel */
module.exports = app;
