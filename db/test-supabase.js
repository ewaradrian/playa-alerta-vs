/**
 * test-supabase.js
 * Script de diagnóstico: verifica la conexión y lectura de tablas en Supabase.
 * Uso: node db/test-supabase.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

function limpiarUrlSupabase(url) {
    if (!url || typeof url !== 'string') return null;
    let limpia = url.trim().replace(/^['"]|['"]$/g, '');
    if (!limpia) return null;
    if (!limpia.startsWith('http://') && !limpia.startsWith('https://')) {
        limpia = 'https://' + limpia;
    }
    return limpia.replace(/\/+$/, '');
}

function limpiarClaveSupabase(clave) {
    if (!clave || typeof clave !== 'string') return null;
    return clave.trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = limpiarUrlSupabase(process.env.SUPABASE_URL);
const supabaseKey = limpiarClaveSupabase(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY);

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan las variables SUPABASE_URL y/o SUPABASE_ANON_KEY en tu archivo .env');
    console.log('Revisa .env.example para ver el formato requerido.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`📡 Conectando a Supabase en: ${supabaseUrl}...`);
    try {
        // 1. Probar lectura de Categoria
        const { data: categorias, error: errCat } = await supabase
            .from('Categoria')
            .select('*');

        if (errCat) {
            console.error('❌ Error al consultar la tabla Categoria:', errCat.message);
            console.log('💡 Tip: Asegúrate de haber ejecutado db/supabase_schema.sql en el SQL Editor de Supabase.');
            return;
        }

        console.log(`✅ Conexión exitosa a Supabase.`);
        console.log(`📋 Categorías disponibles (${categorias.length}):`, categorias.map(c => c.nombre));

        // 2. Probar lectura de ReporteAnonimo
        const { data: reportes, error: errRep } = await supabase
            .from('ReporteAnonimo')
            .select('id_anonimo, titulo, estado, latitud, longitud')
            .limit(5);

        if (errRep) {
            console.error('❌ Error al consultar ReporteAnonimo:', errRep.message);
            return;
        }

        console.log(`📍 Reportes registrados encontrados: ${reportes.length}`);
        console.log('✨ Todo listo para operar con Supabase.');
    } catch (e) {
        console.error('❌ Error inesperado de conexión:', e.message);
    }
})();
