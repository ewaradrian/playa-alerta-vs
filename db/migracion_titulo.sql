-- =============================================================
-- MIGRACIÓN: Añadir columna `titulo` a Reporte y ReporteAnonimo
-- PROYECTO: Playa Alerta
-- FECHA: 2026-11-02
--
-- El formulario de reporte rápido captura un título corto además
-- de la descripción. Esta migración lo persiste en la BD.
-- Ejecutar UNA sola vez en Aiven (defaultdb).
-- =============================================================

-- 1. Tabla Reporte (reportes de usuarios autenticados)
ALTER TABLE Reporte
    ADD COLUMN titulo VARCHAR(120) NOT NULL DEFAULT ''
        COMMENT 'Título breve del reporte ingresado por el usuario'
        AFTER descripcion;

-- 2. Tabla ReporteAnonimo (reportes sin sesión iniciada)
ALTER TABLE ReporteAnonimo
    ADD COLUMN titulo VARCHAR(120) NOT NULL DEFAULT ''
        COMMENT 'Título breve del reporte anónimo'
        AFTER descripcion;

-- Verificar que los cambios se aplicaron correctamente
DESCRIBE Reporte;
DESCRIBE ReporteAnonimo;
