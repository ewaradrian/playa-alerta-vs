/**
 * =============================================================
 * ARCHIVO: server.js
 * PROYECTO: Playa Alerta
 * DESCRIPCIÓN: Servidor Express que:
 *   1. Sirve los archivos estáticos de /public
 *   2. Expone la API REST para guardar reportes en Aiven (MySQL)
 *
 * BASE DE DATOS: Aiven MySQL (defaultdb)
 * TABLAS PRINCIPALES: ReporteAnonimo, Categoria, ZonaPlaya
 * =============================================================
 */

'use strict';

/* Carga las variables de entorno del archivo .env antes que cualquier otra cosa */
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const mysql    = require('mysql2/promise');

const app = express();

/* ── Middlewares globales ─────────────────────────────────── */
app.use(cors());                          /* Permite llamadas desde el frontend */
app.use(express.json());                  /* Parsea cuerpos JSON en las peticiones */
app.use(express.static(path.join(__dirname, 'public'))); /* Sirve HTML/CSS/JS */


/* ── Pool de conexiones a Aiven MySQL ────────────────────── */
const db = mysql.createPool({
    host:               process.env.DB_HOST,
    port:               Number(process.env.DB_PORT),
    database:           process.env.DB_NAME,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    ssl:                { rejectUnauthorized: true }, /* SSL REQUIRED por Aiven */
    waitForConnections: true,
    connectionLimit:    10,   /* Máximo de conexiones paralelas en el pool */
    queueLimit:         0     /* Sin límite de peticiones en espera */
});


/* ── Helpers internos ─────────────────────────────────────── */

/**
 * obtenerIdCategoria(nombre, conn)
 * Busca en la tabla Categoria el ID que corresponde al nombre
 * del tipo de reporte ('trafico' / 'incidencia').
 * Si no existe, la inserta automáticamente.
 *
 * @param {string}          nombre - Nombre de la categoría.
 * @param {mysql.Connection} conn  - Conexión activa del pool.
 * @returns {Promise<number>}      - id_categoria encontrado o creado.
 */
async function obtenerIdCategoria(nombre, conn) {
    const [rows] = await conn.execute(
        'SELECT id_categoria FROM Categoria WHERE nombre = ? LIMIT 1',
        [nombre]
    );

    if (rows.length > 0) return rows[0].id_categoria;

    const [result] = await conn.execute(
        'INSERT INTO Categoria (nombre, visible) VALUES (?, TRUE)',
        [nombre]
    );
    console.log(`[DB] Categoría creada: "${nombre}" → id ${result.insertId}`);
    return result.insertId;
}

/**
 * obtenerIdZona(conn)
 * Devuelve el ID de la primera zona disponible (Playa del Carmen).
 * Si no existe ninguna zona, inserta una por defecto.
 *
 * @param {mysql.Connection} conn - Conexión activa del pool.
 * @returns {Promise<number>}     - id_zona a usar.
 */
async function obtenerIdZona(conn) {
    const [rows] = await conn.execute(
        'SELECT id_zona FROM ZonaPlaya ORDER BY id_zona ASC LIMIT 1'
    );

    if (rows.length > 0) return rows[0].id_zona;

    const [result] = await conn.execute(
        'INSERT INTO ZonaPlaya (colonia, codigo_postal) VALUES (?, ?)',
        ['Playa del Carmen Centro', '77710']
    );
    console.log(`[DB] Zona por defecto creada → id ${result.insertId}`);
    return result.insertId;
}


/* ── Ruta principal (SPA fallback) ───────────────────────── */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


/* ══════════════════════════════════════════════════════════
   ENDPOINT: GET /api/reportes
   Devuelve los reportes registrados para mostrarlos en el mapa.
   ══════════════════════════════════════════════════════════ */
app.get('/api/reportes', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
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
        console.error('[API] Error al consultar reportes:', error.message);
        return res.status(500).json({ ok: false, mensaje: 'Error al consultar reportes.' });
    } finally {
        if (conn) conn.release();
    }
});


/* ══════════════════════════════════════════════════════════
   ENDPOINT: POST /api/reportes
   Guarda un reporte anónimo en la tabla ReporteAnonimo.

   Body esperado (JSON):
   {
     "tipo":        "trafico" | "incidencia",
     "titulo":      string (max 120 chars),
     "descripcion": string,
     "latitud":     string,
     "longitud":    string,
     "estado":      "activo" | "resuelto" | "Y" | "N"
   }
   ══════════════════════════════════════════════════════════ */
app.post('/api/reportes', async (req, res) => {

    /* ── 1. Extrae y valida el cuerpo de la petición ── */
    const { tipo, titulo, descripcion, latitud, longitud, estado } = req.body;

    if (!tipo || !latitud || !longitud) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Faltan campos obligatorios: tipo, latitud, longitud.'
        });
    }

    /* Mapeo de los tipos del frontend a los nombres de categoría en BD */
    const mapaCategoria = {
        trafico:    'Tráfico',
        incidencia: 'Incidencia Vial'
    };

    const nombreCategoria = mapaCategoria[tipo];
    if (!nombreCategoria) {
        return res.status(400).json({
            ok: false,
            mensaje: `Tipo de reporte desconocido: "${tipo}".`
        });
    }

    /* Normalización de estado (Y -> activo, N -> resuelto) */
    const estadoNormalizado = (estado === 'Y' || estado === 'activo')
        ? 'activo'
        : (estado === 'N' || estado === 'resuelto')
            ? 'resuelto'
            : (estado || 'activo');

    /* Captura la IP del cliente para el campo ip_origen */
    const ipOrigen =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || 'desconocida';

    /* ── 2. Obtiene una conexión del pool y ejecuta la transacción ── */
    let conn;
    try {
        conn = await db.getConnection();

        /* Resuelve id_categoria e id_zona de forma dinámica */
        const [idCategoria, idZona] = await Promise.all([
            obtenerIdCategoria(nombreCategoria, conn),
            obtenerIdZona(conn)
        ]);

        /* ── 3. Inserta el reporte anónimo ── */
        const [result] = await conn.execute(
            `INSERT INTO ReporteAnonimo
                (id_categoria, id_zona, titulo, descripcion,
                 latitud, longitud, estado, ip_origen)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                idCategoria,
                idZona,
                (titulo      || '').substring(0, 120),
                (descripcion || '').substring(0, 500),
                String(latitud).substring(0, 20),
                String(longitud).substring(0, 20),
                estadoNormalizado.substring(0, 30),
                ipOrigen
            ]
        );

        const idGenerado = result.insertId;
        console.log(`[API] Reporte anónimo guardado → id ${idGenerado} | tipo: ${tipo} | estado: ${estadoNormalizado}`);

        /* ── 4. Responde con éxito ── */
        return res.status(201).json({ ok: true, id: idGenerado });

    } catch (error) {
        console.error('[API] Error al guardar reporte:', error.message);
        return res.status(500).json({
            ok: false,
            mensaje: 'Error interno al guardar el reporte. Intenta de nuevo.'
        });

    } finally {
        if (conn) conn.release();
    }
});


/* ── Arranque del servidor ────────────────────────────────── */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[Playa Alerta] Servidor corriendo en http://localhost:${PORT}`);
    console.log(`[Playa Alerta] API disponible en  http://localhost:${PORT}/api/reportes`);
});
