-- =============================================================
-- ESQUEMA COMPLETO PARA SUPABASE (POSTGRESQL)
-- PROYECTO: Playa Alerta
-- FECHA: 2026-11-11
--
-- INSTRUCCIONES:
-- 1. Entra a tu proyecto en https://supabase.com
-- 2. Ve a la sección "SQL Editor" en el menú lateral izquierdo.
-- 3. Crea una "New query", pega todo este contenido y presiona "Run".
-- =============================================================

-- Habilitar extensión UUID (por si se requiere en el futuro)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. TABLA: Administrador ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "Administrador" (
    id_admin SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    nivel_acceso VARCHAR(50) NOT NULL DEFAULT 'soporte' CHECK (nivel_acceso IN ('superadmin', 'soporte')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. TABLA: Usuario ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Usuario" (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'ciudadano' CHECK (rol IN ('ciudadano', 'moderador')),
    estado_cuenta VARCHAR(50) NOT NULL DEFAULT 'activo' CHECK (estado_cuenta IN ('activo', 'suspendido')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. TABLA: RegistroActividadAdmin ────────────────────────
CREATE TABLE IF NOT EXISTS "RegistroActividadAdmin" (
    id_registro SERIAL PRIMARY KEY,
    accion_realizada VARCHAR(255) NOT NULL,
    fecha_hora TIMESTAMPTZ DEFAULT NOW(),
    id_admin INTEGER REFERENCES "Administrador"(id_admin) ON DELETE SET NULL
);

-- ── 4. TABLA: Categoria ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Categoria" (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    visible BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── 5. TABLA: ZonaPlaya ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ZonaPlaya" (
    id_zona SERIAL PRIMARY KEY,
    colonia VARCHAR(150) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL
);

-- ── 6. TABLA: Reporte (Usuarios registrados) ────────────────
CREATE TABLE IF NOT EXISTS "Reporte" (
    id_reporte SERIAL PRIMARY KEY,
    id_categoria INTEGER NOT NULL REFERENCES "Categoria"(id_categoria) ON DELETE RESTRICT,
    id_zona INTEGER NOT NULL REFERENCES "ZonaPlaya"(id_zona) ON DELETE RESTRICT,
    titulo VARCHAR(120) NOT NULL DEFAULT '',
    descripcion TEXT NOT NULL,
    latitud VARCHAR(30) NOT NULL,
    longitud VARCHAR(30) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'activo',
    id_usuario INTEGER REFERENCES "Usuario"(id_usuario) ON DELETE CASCADE,
    id_admin_revisor INTEGER REFERENCES "Administrador"(id_admin) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. TABLA: ReporteAnonimo (Reporte rápido sin login) ─────
CREATE TABLE IF NOT EXISTS "ReporteAnonimo" (
    id_anonimo SERIAL PRIMARY KEY,
    id_categoria INTEGER NOT NULL REFERENCES "Categoria"(id_categoria) ON DELETE RESTRICT,
    id_zona INTEGER NOT NULL REFERENCES "ZonaPlaya"(id_zona) ON DELETE RESTRICT,
    titulo VARCHAR(120) NOT NULL DEFAULT '',
    descripcion TEXT NOT NULL,
    latitud VARCHAR(30) NOT NULL,
    longitud VARCHAR(30) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'activo',
    ip_origen VARCHAR(60) DEFAULT 'desconocida',
    id_admin_revisor INTEGER REFERENCES "Administrador"(id_admin) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DATOS INICIALES (SEMILLA) ────────────────────────────────
-- Categorías por defecto del Menú Rápido
INSERT INTO "Categoria" (nombre, visible)
VALUES 
    ('Tráfico', TRUE),
    ('Incidencia Vial', TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- Zona base de Playa del Carmen
INSERT INTO "ZonaPlaya" (colonia, codigo_postal)
SELECT 'Playa del Carmen Centro', '77710'
WHERE NOT EXISTS (SELECT 1 FROM "ZonaPlaya" WHERE colonia = 'Playa del Carmen Centro');

-- ── POLÍTICAS DE SEGURIDAD RLS (Row Level Security) ──────────
-- Habilitar RLS en las tablas expuestas a la API
ALTER TABLE "Categoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ZonaPlaya" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReporteAnonimo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reporte" ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para Categoria: lectura pública e inserción
DROP POLICY IF EXISTS "Permitir lectura publica de Categoria" ON "Categoria";
CREATE POLICY "Permitir lectura publica de Categoria" 
    ON "Categoria" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion de Categoria" ON "Categoria";
CREATE POLICY "Permitir insercion de Categoria" 
    ON "Categoria" FOR INSERT WITH CHECK (true);

-- 2. Políticas para ZonaPlaya: lectura pública e inserción
DROP POLICY IF EXISTS "Permitir lectura publica de ZonaPlaya" ON "ZonaPlaya";
CREATE POLICY "Permitir lectura publica de ZonaPlaya" 
    ON "ZonaPlaya" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion de ZonaPlaya" ON "ZonaPlaya";
CREATE POLICY "Permitir insercion de ZonaPlaya" 
    ON "ZonaPlaya" FOR INSERT WITH CHECK (true);

-- 3. Políticas para ReporteAnonimo: lectura e inserción pública
DROP POLICY IF EXISTS "Permitir lectura publica de ReporteAnonimo" ON "ReporteAnonimo";
CREATE POLICY "Permitir lectura publica de ReporteAnonimo" 
    ON "ReporteAnonimo" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de ReporteAnonimo" ON "ReporteAnonimo";
CREATE POLICY "Permitir insercion publica de ReporteAnonimo" 
    ON "ReporteAnonimo" FOR INSERT WITH CHECK (true);

-- 4. Políticas para Reporte: lectura pública
DROP POLICY IF EXISTS "Permitir lectura publica de Reporte" ON "Reporte";
CREATE POLICY "Permitir lectura publica de Reporte" 
    ON "Reporte" FOR SELECT USING (true);

-- ── VERIFICACIÓN ─────────────────────────────────────────────
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
