#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generar_doc_10.py
Genera el documento técnico .docx correspondiente al Commit 10 del proyecto Playa Alerta:
Panel de Administración con Acceso por Contraseña 'VIALIDADES' y Eliminación de Reportes.
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

def generar_doc_10():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 10: PANEL DE ADMINISTRACIÓN Y ELIMINACIÓN DE REPORTES",
        subtitle_text="Control de acceso con contraseña 'VIALIDADES', tabla de gestión y endpoint REST de eliminación"
    )
    
    add_metadata_table(doc, {
        "Commit": "Pendiente de registro (Commit 10)",
        "Fecha de Registro": "17 de Noviembre de 2026",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "Implementar panel de administrador con clave VIALIDADES y eliminacion de reportes",
        "Tipo de Cambio": "Módulo Administrativo y Depuración de Reportes (Seguridad y Moderación)"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit reconvierte el botón superior de usuario en una puerta de entrada segura hacia el Panel de Administración "
        "de Playa Alerta. Mediante la autenticación con la clave 'VIALIDADES', los supervisores municipales y administradores "
        "pueden visualizar la totalidad de los reportes viales registrados en la base de datos (Supabase / MySQL) a través de "
        "una tabla interactiva de moderación. Desde dicha vista se proporciona la capacidad de filtrar en vivo, alternar el "
        "estado operativo (activo / resuelto), volar al punto en el mapa y eliminar definitivamente reportes inválidos o de prueba.",
        bold_prefix="Objetivo General:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "El desarrollo integra seguridad en cliente y servidor junto a una experiencia de usuario reactiva:",
        bold_prefix="Detalles de Implementación:"
    )
    add_bullet_styled(
        doc,
        "Al presionar el botón de usuario (btnUsuario), se comprueba el estado de sesión en sessionStorage. Si el usuario no está autenticado, se presenta una tarjeta centrada con ícono de seguridad, campo de contraseña y validación en tiempo real. La contraseña autorizada es 'VIALIDADES' (insensible a mayúsculas/minúsculas).",
        bold_prefix="Control de Acceso (Gatekeeping):"
    )
    add_bullet_styled(
        doc,
        "Una vez validada la clave, el modal se expande suavemente (max-w-4xl) para desplegar el Panel de Administración. Incluye barra de búsqueda instantánea por ID, título, descripción o categoría, contadores globales de reportes (total, activos y resueltos), y un botón de cierre de sesión seguro.",
        bold_prefix="Panel de Moderación y Búsqueda:"
    )
    add_bullet_styled(
        doc,
        "Cada fila de la tabla expone la categoría, título y descripción truncada con tooltip, coordenadas con botón para centrar y abrir el popup en el mapa, y un botón pill para conmutar el estado entre 'Activo' y 'Resuelto' en un solo clic.",
        bold_prefix="Tabla Interactiva de Reportes:"
    )
    add_bullet_styled(
        doc,
        "Se agregó el endpoint DELETE /api/reportes/:id en server.js. Requiere el envío de la clave en la cabecera 'x-admin-password'. Al ser invocado, remueve el registro de Supabase o MySQL. En el frontend, solicita confirmación explícita al operador, retira la fila con animación y llama a MapController.removerMarcador(id) para hacer desaparecer instantáneamente el marcador del mapa sin recargar la página.",
        bold_prefix="Endpoint DELETE y Reactividad en Mapa:"
    )
    add_bullet_styled(
        doc,
        "Se actualizaron las políticas RLS en db/supabase_schema.sql agregando permisos explícitos de UPDATE y DELETE sobre la tabla ReporteAnonimo para garantizar operaciones sin restricciones de clave anónima.",
        bold_prefix="Políticas RLS en Supabase:"
    )
    
    add_callout(
        doc,
        "La integración directa entre la tabla administrativa y el mapa Leaflet permite moderar incidentes en terreno y visualizarlos inmediatamente sincronizados entre todos los dispositivos.",
        title="MODERACIÓN EFECTIVA"
    )
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        ["server.js", "Modificado", "+93 líneas", "Endpoints DELETE /api/reportes/:id y POST /api/admin/verify con autenticación VIALIDADES"],
        ["public/index.html", "Modificado", "+150 líneas", "Estructura HTML para el formulario de login y tabla completa de administración"],
        ["public/map.js", "Modificado", "+400 líneas", "Lógica de login, renderizado de tabla, búsqueda en vivo, toggle de estado y eliminación reactiva"],
        ["public/styles.css", "Modificado", "+15 líneas", "Transición de anchura de modal y scrollbars estilizados"],
        ["db/supabase_schema.sql", "Modificado", "+10 líneas", "Políticas RLS de actualización y eliminación para ReporteAnonimo"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "Compilación y chequeo de sintaxis exitoso en backend y frontend (`node -c server.js` y `node -c public/map.js`).", bold_prefix="Sintaxis:")
    add_bullet_styled(doc, "Al presionar el icono de usuario se solicita la contraseña 'VIALIDADES'; contraseñas erróneas son rechazadas con alerta visual.", bold_prefix="Autenticación:")
    add_bullet_styled(doc, "Tras ingresar la contraseña, se abre la tabla con todos los reportes existentes de la base de datos.", bold_prefix="Carga de Tabla:")
    add_bullet_styled(doc, "Al hacer clic en 'Eliminar' y confirmar, el reporte se borra de Supabase/MySQL, desaparece de la tabla y su marcador se retira del mapa Leaflet.", bold_prefix="Eliminación Completa:")
    add_bullet_styled(doc, "El botón 'Salir' limpia la sesión y retorna a la vista de login protegida.", bold_prefix="Cierre de Sesión:")
    
    out_path = os.path.join(OUTPUT_DIR, "10_Commit_Panel_Administrador_y_Eliminacion_Reportes.docx")
    doc.save(out_path)
    print(f"Generado exitosamente: {out_path}")

if __name__ == "__main__":
    generar_doc_10()
