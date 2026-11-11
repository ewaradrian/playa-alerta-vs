#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generar_doc_9.py
Genera el documento técnico .docx correspondiente al Commit 9 del proyecto Playa Alerta:
Geolocalización GPS en Reporte Rápido y Selector de STATUS en Popups de Marcadores.
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

def generar_doc_9():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 9: GEOLOCALIZACIÓN GPS Y STATUS EN POPUPS DE MARCADORES",
        subtitle_text="Obtención de coordenadas reales mediante Geolocation API y gestión reactiva de estado (Y/N) en mapa"
    )
    
    add_metadata_table(doc, {
        "Commit Hash": "949db41e3664ebe3e2d70f1e2fe342f90fab528b (949db41)",
        "Fecha de Registro": "11 de Noviembre de 2026",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "Implementar geolocalizacion GPS en reporte rapido y selector de status en popup del marcador",
        "Tipo de Cambio": "Mejora de UX en Creación y Actualización Reactiva de Reportes"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit atiende dos requerimientos cruciales de usabilidad en terreno para los ciudadanos de Playa del Carmen: "
        "en primer lugar, automatiza la captura de coordenadas geográficas exactas utilizando el sensor GPS del dispositivo "
        "(a través de la Geolocation API del navegador) al presionar los accesos rápidos de Tráfico o Incidencia Vial, "
        "eliminando la necesidad de buscar manualmente la posición en el mapa. En segundo lugar, traslada el selector de STATUS "
        "(Y / N) fuera del formulario de creación y lo integra directamente dentro del popup interactivo de cada marcador en el mapa, "
        "permitiendo que cualquier usuario o brigadista consulte un incidente y lo actualice como 'activo' o 'resuelto' en tiempo real.",
        bold_prefix="Objetivo General:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "La implementación se estructuró en tres capas complementarias:",
        bold_prefix="Detalles de Implementación:"
    )
    add_bullet_styled(
        doc,
        "Se implementó el método privado _iniciarReporteRapido(tipo) en UIController que invoca navigator.geolocation.getCurrentPosition() con alta precisión (enableHighAccuracy: true). Durante la solicitud se despliega un indicador animado en el botón y un toast informativo. Al resolverse, el mapa ejecuta un vuelo suave (flyTo) hacia las coordenadas GPS, ubica el marcador de selección MAP POINT y despliega el formulario con la ubicación exacta. En caso de rechazo de permisos o falta de señal, el sistema recurre al centro del mapa notificando al usuario.",
        bold_prefix="Geolocalización GPS en Reporte Rápido:"
    )
    add_bullet_styled(
        doc,
        "Se removió el bloque de STATUS del formulario en public/index.html y public/map.js. Los nuevos reportes se registran por defecto en estado 'activo'. En su lugar, el método agregarMarcadorConfirmado() de MapController construye dinámicamente el popup mediante nodos DOM vivos, incorporando botones tipo toggle 'Y' (Activo - verde) y 'N' (Resuelto - rojo) con el texto STATUS, conforme a los diagramas de referencia.",
        bold_prefix="Integración de STATUS en Popup de Marcador:"
    )
    add_bullet_styled(
        doc,
        "Se añadió el endpoint PATCH /api/reportes/:id/estado en server.js. Acepta tanto 'activo' / 'resuelto' como los alias 'Y' / 'N', actualizando de forma transparente la tabla ReporteAnonimo en Supabase (PostgreSQL) o en MySQL (modo fallback).",
        bold_prefix="Nuevo Endpoint REST (PATCH /api/reportes/:id/estado):"
    )
    add_bullet_styled(
        doc,
        "Al presionar Y o N en el popup, se dispara el callback asíncrono hacia el servidor. Al confirmarse el cambio en la base de datos, el badge del popup cambia inmediatamente de color y texto (ACTIVO / RESUELTO), los botones alternan su estado visual y el marcador en el mapa atenúa su opacidad (0.6 para incidentes resueltos y 1.0 para activos), acompañado de una notificación toast flotante.",
        bold_prefix="Reactividad Visual en Mapa:"
    )
    
    add_callout(
        doc,
        "La actualización de estado desde el popup del marcador permite que la comunidad valide o cierre incidencias directamente sobre el mapa sin recargar la página ni navegar entre pantallas complejas.",
        title="VALOR DE USABILIDAD"
    )
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        ["server.js", "Modificado", "+75 / -2 líneas", "Nuevo endpoint PATCH /api/reportes/:id/estado con normalización de estados y soporte dual Supabase/MySQL"],
        ["public/index.html", "Modificado", "-31 líneas", "Eliminación del campo STATUS del formulario de creación modal"],
        ["public/map.js", "Modificado", "+160 / -98 líneas", "Implementación de geolocalización GPS, botones interactivos Y/N en popup Leaflet y sincronización con API"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "Validación de sintaxis en Node.js 24 ejecutada exitosamente (`node -c server.js` y `node -c public/map.js`).", bold_prefix="Sintaxis:")
    add_bullet_styled(doc, "Al pulsar Tráfico o Incidencias en el menú inferior, se activa la solicitud GPS, el mapa vuela a la posición real y se abre el formulario.", bold_prefix="Geolocalización:")
    add_bullet_styled(doc, "El formulario de creación ya no contiene los botones de STATUS, enviando estado 'activo' por defecto.", bold_prefix="Formulario Limpio:")
    add_bullet_styled(doc, "Al hacer clic en cualquier marcador del mapa, el popup muestra el título, descripción y los botones Y / N de STATUS.", bold_prefix="Popup Interactivo:")
    add_bullet_styled(doc, "Al pulsar N, se emite PATCH al backend, el badge cambia a RESUELTO, el botón N se resalta en rojo y el marcador se vuelve semi-transparente en el mapa.", bold_prefix="Actualización de Estado:")
    
    out_path = os.path.join(OUTPUT_DIR, "09_Commit_949db41_Geolocalizacion_GPS_y_Status_Popup.docx")
    doc.save(out_path)
    print(f"Generado exitosamente: {out_path}")

if __name__ == "__main__":
    generar_doc_9()
