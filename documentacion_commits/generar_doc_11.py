#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generar_doc_11.py
Genera el documento técnico .docx correspondiente al Commit 11 del proyecto Playa Alerta:
Corrección de Políticas RLS (Row Level Security) en Supabase para UPDATE y DELETE y Comprobación de Filas Afectadas.
"""

import os
import sys

sys.path.append(r"c:\Users\ewara\OneDrive\Escritorio\capetero carpetin\playa-alerta-vs\documentacion_commits")
from generador_base import (
    create_base_doc,
    add_header_banner,
    add_metadata_table,
    add_section_heading,
    add_paragraph_styled,
    add_bullet_styled,
    add_callout,
    add_files_table,
    OUTPUT_DIR
)

def generar_doc_11():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 11: CORRECCIÓN DE SEGURIDAD RLS EN SUPABASE Y VALIDACIÓN DE FILAS AFECTADAS",
        subtitle_text="Políticas de UPDATE y DELETE en PostgreSQL, detección de 0 filas en Express y soporte para Service Role Key"
    )
    
    add_metadata_table(doc, {
        "Commit": "Pendiente de registro (Commit 11)",
        "Fecha de Registro": "17 de Noviembre de 2026",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "fix: resolver bloqueo de RLS en Supabase para UPDATE y DELETE y agregar verificacion de filas afectadas",
        "Tipo de Cambio": "Seguridad de Base de Datos, Manejo de Políticas RLS y Robusteza en Servidor"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit soluciona de raíz la anomalía reportada donde la eliminación de reportes desde el panel de "
        "administración y la actualización de estado (marcar como resuelto / activo desde el popup del mapa) "
        "retornaban código 200 en Vercel pero no alteraban los registros en la tabla 'ReporteAnonimo' de Supabase. "
        "Dicho síntoma se debía a que Supabase tiene activado Row Level Security (RLS) pero solo contaba con políticas "
        "para INSERT y SELECT. En PostgREST, cuando una consulta carece de permisos de UPDATE o DELETE bajo RLS, no arroja "
        "un error explícito sino que filtra 0 filas. En este commit se actualizan los esquemas SQL para otorgar políticas "
        "completas a ReporteAnonimo y se refactorizan los endpoints de Express para verificar explícitamente las filas afectadas.",
        bold_prefix="Diagnóstico y Solución:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "La intervención abarca tanto la capa de base de datos en PostgreSQL/Supabase como el backend Node.js / Express en Vercel:",
        bold_prefix="Detalles Técnicos:"
    )
    add_bullet_styled(
        doc,
        "db/supabase_schema.sql & db/solucion_rls.sql: Se formalizan las políticas de seguridad para UPDATE ('WITH CHECK (true)') "
        "y DELETE ('USING (true)') sobre la tabla ReporteAnonimo, garantizando que el usuario público o el cliente REST puedan "
        "actualizar el estado de incidencias viales y el administrador pueda depurar registros.",
        bold_prefix="Políticas RLS en Supabase:"
    )
    add_bullet_styled(
        doc,
        "server.js (PATCH /api/reportes/:id/estado): Se incorpora .select() en la sentencia de actualización de Supabase. "
        "Si la respuesta arroja 0 filas modificadas (causado por ausencia de políticas RLS o ID inexistente), el servidor "
        "devuelve un error descriptivo HTTP 403 / advertencia en lugar de reportar falsamente una operación exitosa.",
        bold_prefix="Verificación de Filas en UPDATE:"
    )
    add_bullet_styled(
        doc,
        "server.js (DELETE /api/reportes/:id): Se implementa .select() en la sentencia de eliminación para evaluar si efectivamente "
        "se removió el registro de la base de datos. Ante 0 filas eliminadas, emite retroalimentación clara para prevenir fallos silenciosos.",
        bold_prefix="Verificación de Filas en DELETE:"
    )
    add_bullet_styled(
        doc,
        "Soporte de SUPABASE_SERVICE_ROLE_KEY: Se documenta y prioriza el uso de la clave 'service_role' en Vercel, la cual "
        "omite de forma automática las restricciones de RLS en entornos de servidor seguro, manteniendo el frontend protegido.",
        bold_prefix="Buenas Prácticas de Arquitectura:"
    )
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        ["server.js", "Modificado", "+26 líneas", "Validación estricta de filas afectadas en UPDATE y DELETE mediante .select(); alertas descriptivas de RLS."],
        ["db/supabase_schema.sql", "Modificado", "+5 líneas", "Definición de políticas RLS para UPDATE con WITH CHECK y DELETE en ReporteAnonimo."],
        ["db/solucion_rls.sql", "Nuevo", "+25 líneas", "Script SQL independiente listo para ejecutar en el SQL Editor de Supabase."],
        ["documentacion_commits/11_Commit_Correccion_RLS_Supabase_y_Politicas_Update_Delete.docx", "Nuevo", "Generado", "Documento técnico oficial correspondiente a este cambio."]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Instrucciones de Despliegue y Ejecución")
    add_callout(
        doc,
        "Instrucciones Clave para Supabase y Vercel",
        "1. Entrar a https://supabase.com/dashboard -> Ir al proyecto de Playa Alerta -> SQL Editor.\n"
        "2. Copiar y pegar el script 'db/solucion_rls.sql' y presionar 'Run' (o hacer clic en 'Disable RLS' en la tabla ReporteAnonimo).\n"
        "3. (Recomendado) En Supabase -> Project Settings -> API -> Project API keys, copiar el 'service_role secret' "
        "y agregarlo como 'SUPABASE_SERVICE_ROLE_KEY' en Vercel -> Settings -> Environment Variables."
    )
    
    out_path = os.path.join(OUTPUT_DIR, "11_Commit_Correccion_RLS_Supabase_y_Politicas_Update_Delete.docx")
    doc.save(out_path)
    print(f"Generado exitosamente: {out_path}")

if __name__ == "__main__":
    generar_doc_11()
