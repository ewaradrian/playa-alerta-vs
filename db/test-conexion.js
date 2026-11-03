/**
 * test-conexion.js
 * Script de diagnóstico: verifica que la conexión a Aiven MySQL funciona.
 * Uso: node db/test-conexion.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

(async () => {
    let c;
    try {
        c = await mysql.createConnection({
            host:     process.env.DB_HOST,
            port:     Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user:     process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl:      { rejectUnauthorized: true }
        });

        const [r] = await c.execute('SHOW TABLES');
        console.log('✅ CONEXIÓN OK. Tablas:', r.map(x => Object.values(x)[0]));
    } catch (e) {
        console.error('❌ ERROR de conexión:', e.message);
    } finally {
        if (c) await c.end();
    }
})();
