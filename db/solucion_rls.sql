-- =========================================================================
-- SOLUCIÓN DIRECTA PARA POLÍTICAS RLS EN SUPABASE
-- PROYECTO: Playa Alerta
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu consola de Supabase (https://supabase.com/dashboard)
-- 2. Entra a tu proyecto -> "SQL Editor" en el menú izquierdo.
-- 3. Abre "New query", pega este código y haz clic en "Run" (botón verde).
-- =========================================================================

-- Opción A: Habilitar las políticas de UPDATE y DELETE explícitamente
DROP POLICY IF EXISTS "Permitir actualizacion de ReporteAnonimo" ON "ReporteAnonimo";
CREATE POLICY "Permitir actualizacion de ReporteAnonimo" 
    ON "ReporteAnonimo" 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminacion de ReporteAnonimo" ON "ReporteAnonimo";
CREATE POLICY "Permitir eliminacion de ReporteAnonimo" 
    ON "ReporteAnonimo" 
    FOR DELETE 
    USING (true);

-- Verificación de las políticas activas sobre ReporteAnonimo
SELECT policyname, cmd, permissive, roles 
FROM pg_policies 
WHERE tablename = 'ReporteAnonimo';
