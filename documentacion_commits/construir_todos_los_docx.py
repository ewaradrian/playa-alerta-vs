#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generar_todos_los_docx.py
Genera los 7 documentos .docx correspondientes a los 7 commits del proyecto Playa Alerta.
"""

import os
import sys

# Importar funciones de ayuda
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

def generar_doc_1():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 1: INICIALIZACIÓN DEL PROYECTO Y SERVIDOR BASE",
        subtitle_text="Configuración inicial de dependencias, servidor Express y mapa base Leaflet"
    )
    
    add_metadata_table(doc, {
        "Commit Hash": "683af1916acfe261ce43ac2436e58aca03602be3 (683af19)",
        "Fecha de Registro": "27 de Octubre de 2026, 11:14:26 -05:00",
        "Autor / Committer": "Adrian Gonzalez <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "Inicio Playa Alertas",
        "Tipo de Cambio": "Inicialización de Repositorio (Initial Commit)"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit representa el hito fundacional del sistema Playa Alerta. Establece la estructura de directorios, "
        "el entorno de ejecución en Node.js, las dependencias fundamentales de backend y frontend, y el servicio "
        "HTTP básico encargado de despachar los archivos estáticos hacia los navegadores de los usuarios.",
        bold_prefix="Objetivo General:"
    )
    add_paragraph_styled(
        doc,
        "La necesidad principal fue crear una base tecnológica sólida, ligera y desacoplada que permitiera desplegar un "
        "mapa interactivo para la ciudad de Playa del Carmen (Quintana Roo), sirviendo como cimiento para las futuras "
        "funcionalidades de reporte de incidentes y tráfico vehicular.",
        bold_prefix="Contexto Operativo:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "En esta etapa se establecieron tres pilares clave:",
        bold_prefix="Estructura de la Solución:"
    )
    add_bullet_styled(
        doc,
        "Configuración del entorno a través de package.json, definiendo dependencias como Express 5, mysql2, cors, bcryptjs y jsonwebtoken.",
        bold_prefix="Gestor de Paquetes:"
    )
    add_bullet_styled(
        doc,
        "Implementación de server.js con Express, habilitando el middleware express.static para servir el contenido de la carpeta /public en el puerto 3000.",
        bold_prefix="Servidor HTTP (Backend):"
    )
    add_bullet_styled(
        doc,
        "Maquetado HTML inicial (index.html) integrando la librería Leaflet v1.9.4 desde CDN, y script map.js con inicialización básica del mapa centrado en Playa del Carmen.",
        bold_prefix="Capa Visual (Frontend):"
    )
    add_bullet_styled(
        doc,
        "Incorporación del activo gráfico institucional logo.png para la identidad visual de la plataforma.",
        bold_prefix="Activos Gráficos:"
    )
    
    add_callout(
        doc,
        "La aplicación se diseñó como una Single Page Application (SPA) donde el servidor Express actúa tanto como servidor de activos como capa de enlace para futuras APIs REST.",
        title="DECISIÓN DE DISEÑO"
    )
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        ["package.json", "Creación", "+20 líneas", "Definición del proyecto, scripts y dependencias (Express, mysql2, cors)"],
        ["package-lock.json", "Creación", "+1,136 líneas", "Árbol de dependencias resueltas para reproducibilidad"],
        ["server.js", "Creación", "+16 líneas", "Servidor Express básico en puerto 3000 sirviendo /public"],
        ["public/index.html", "Creación", "+41 líneas", "Estructura HTML con enlaces a Leaflet y contenedor #map"],
        ["public/map.js", "Creación", "+24 líneas", "Script inicial de Leaflet con coordenadas de Playa del Carmen"],
        ["public/logo.png", "Creación", "Binario (22 KB)", "Logotipo institucional de Playa Alerta"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "Comando `node server.js` ejecutado exitosamente en http://localhost:3000.", bold_prefix="Arranque del Servidor:")
    add_bullet_styled(doc, "El navegador carga index.html y Leaflet renderiza las teselas de OpenStreetMap sin errores de consola.", bold_prefix="Renderizado:")
    add_bullet_styled(doc, "Estructura lista para la implementación de patrones de diseño avanzados.", bold_prefix="Validación:")
    
    out_path = os.path.join(OUTPUT_DIR, "01_Commit_683af19_Inicio_Playa_Alertas.docx")
    doc.save(out_path)
    print(f"Generado: {out_path}")

def generar_doc_2():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 2: ARQUITECTURA OOP Y MENÚ DE REPORTE RÁPIDO",
        subtitle_text="Patrón orientado a objetos (MapController, UIController, PlayaAlertaApp) y estilos glassmorphism"
    )
    
    add_metadata_table(doc, {
        "Commit Hash": "ad2e3270fbd602f4d2d184f6a5b898218e349887 (ad2e327)",
        "Fecha de Registro": "02 de Noviembre de 2026, 18:37:58 -05:00",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "2do commit",
        "Tipo de Cambio": "Refactorización y Nuevas Funcionalidades de UI"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit marca una transición fundamental en el proyecto: la migración de un script procedural plano "
        "a una arquitectura orientada a objetos (OOP) profesional y modular basada en el Principio de Responsabilidad "
        "Única (SRP). Simultáneamente, se introdujo el diseño visual moderno basado en 'glassmorphism' (fondos "
        "translúcidos con desenfoque) y el Menú de Reporte Rápido con botones flotantes para Tráfico e Incidencias.",
        bold_prefix="Objetivo General:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "El código JavaScript se estructuró formalmente en tres clases independientes:",
        bold_prefix="Diseño de Clases:"
    )
    add_bullet_styled(
        doc,
        "Responsable exclusivo de la instancia del mapa Leaflet. Define coordenadas del centro de Playa del Carmen [20.6296, -87.0739], niveles de zoom (mínimo 12, inicial 14, máximo 18), límites geográficos estrictos de Quintana Roo mediante L.latLngBounds([20.3000, -87.4000], [20.8000, -86.8000]) con maxBoundsViscosity de 1.0 para impedir desplazamientos fuera del área urbana, y reubicación del widget de zoom.",
        bold_prefix="MapController:"
    )
    add_bullet_styled(
        doc,
        "Encapsula toda la interacción con el usuario y eventos del DOM. No manipula el mapa directamente. Gestiona clics en el botón de usuario (#btnUsuario), botón de reporte de tráfico (#btnTrafico) y botón de incidencias (#btnIncidencia).",
        bold_prefix="UIController:"
    )
    add_bullet_styled(
        doc,
        "Orquestador de arranque de la aplicación (patrón Application Controller / Singleton). Instancia el mapa, conecta los controladores y enlaza la inicialización tras el evento DOMContentLoaded.",
        bold_prefix="PlayaAlertaApp:"
    )
    
    add_paragraph_styled(
        doc,
        "Se creó el archivo styles.css con reglas específicas que complementan a Tailwind CSS:",
        bold_prefix="Hoja de Estilos (styles.css):"
    )
    add_bullet_styled(doc, "Bloqueo de scroll y ajuste 100% de alto y ancho (overflow: hidden; height: 100%; width: 100%).", bold_prefix="Reset Base:")
    add_bullet_styled(doc, "Fijación del mapa en position: fixed; inset: 0; z-index: 0 como capa base.", bold_prefix="Contenedor #map:")
    add_bullet_styled(doc, "Efecto glassmorphism mediante backdrop-filter: blur(6px) y fondo rgba(255,255,255,0.88).", bold_prefix="Panel #quickReportMenu:")
    add_bullet_styled(doc, "Dimensiones de 64x64 px, circulares (border-radius: 50%), sombras táctiles con efectos hover (scale 1.1) y active (scale 0.96).", bold_prefix="Botones .report-btn:")
    add_bullet_styled(doc, "Sobreescritura de .leaflet-bottom.leaflet-right subiéndolo a bottom: 160px para no quedar tapado por el menú flotante.", bold_prefix="Control de Zoom:")
    
    add_callout(
        doc,
        "La arquitectura OOP implementada garantiza alta cohesión y bajo acoplamiento: si el proveedor del mapa cambia o se añaden nuevas capas, la interfaz de usuario no sufre modificaciones.",
        title="PRINCIPIO ARQUITECTÓNICO"
    )
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        ["public/index.html", "Modificado", "+232 / -48 líneas", "Inclusión de Tailwind CDN, panel de logo glassmorphism, botón de usuario y menú rápido"],
        ["public/map.js", "Modificado", "+319 / -24 líneas", "Implementación completa de MapController, UIController y PlayaAlertaApp"],
        ["public/styles.css", "Creación", "+113 líneas", "Estilos para glassmorphism, botones circulares .report-btn y ajuste de controles"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "Límites geográficos probados arrastrando el mapa: rebota correctamente dentro de Quintana Roo.", bold_prefix="Límites de Mapa:")
    add_bullet_styled(doc, "Los botones de Tráfico e Incidencia responden con feedback táctil y emiten alerta de confirmación.", bold_prefix="Interacción UI:")
    add_bullet_styled(doc, "El control de zoom no colisiona visualmente con el menú flotante de la esquina inferior derecha.", bold_prefix="Posicionamiento:")
    
    out_path = os.path.join(OUTPUT_DIR, "02_Commit_ad2e327_Arquitectura_OOP_y_Menu_Reporte.docx")
    doc.save(out_path)
    print(f"Generado: {out_path}")

def generar_doc_3():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 3: MODAL DE REGISTRO DE REPORTES RÁPIDOS",
        subtitle_text="Formulario interactivo para captura de título, descripción y archivos adjuntos"
    )
    
    add_metadata_table(doc, {
        "Commit Hash": "b9102ebfc938cfa114e45ff41ed75118ea2f6b3c (b9102eb)",
        "Fecha de Registro": "02 de Noviembre de 2026, 18:51:50 -05:00",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "...",
        "Tipo de Cambio": "Implementación de Formulario Modal de Reportes Rápidos"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "En este commit se reemplazaron los diálogos nativos del navegador (alert()) por una interfaz modal completa, "
        "atractiva y profesional para la captura y registro de reportes ciudadanos, siguiendo al pie de la letra "
        "el esquema visual proporcionado por el usuario (título, descripción, adjuntos y cabecera coloreada).",
        bold_prefix="Objetivo General:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "Se implementó el elemento #reportModal en public/index.html con posición z-index: 50, compuesto por:",
        bold_prefix="Estructura del Formulario Modal:"
    )
    add_bullet_styled(doc, "Capa oscura semitransparente con desenfoque (#modalOverlay) para focalizar la atención.", bold_prefix="Overlay:")
    add_bullet_styled(doc, "Cabecera dinámica (#modalHeader) que adapta su color de fondo e ícono según la categoría (ámbar #D97706 para Tráfico y rojo #DC2626 para Incidencia Vial), acompañada de botón de cierre ✕.", bold_prefix="Cabecera Reactiva:")
    add_bullet_styled(doc, "Input de texto con validación requerida y límite de 80 caracteres (#inputTitulo).", bold_prefix="Campo Título:")
    add_bullet_styled(doc, "Textarea multilínea sin redimensionamiento manual con límite de 300 caracteres (#inputDescripcion).", bold_prefix="Campo Descripción:")
    add_bullet_styled(doc, "Zona de carga interactiva (#adjuntosLabel e #inputAdjuntos) para fotos o videos, mostrando el conteo de archivos seleccionados en tiempo real.", bold_prefix="Campo Adjuntos:")
    add_bullet_styled(doc, "Botón de acción (#btnEnviarReporte) que hereda el color del tipo de reporte seleccionado.", bold_prefix="Botón Enviar:")
    
    add_paragraph_styled(
        doc,
        "La clase UIController en public/map.js fue enriquecida con los métodos privados de gestión del ciclo de vida del modal:",
        bold_prefix="Lógica en UIController:"
    )
    add_bullet_styled(doc, "Configura títulos, colores, íconos SVG, limpia campos anteriores y hace visible el modal.", bold_prefix="_abrirModal(tipo):")
    add_bullet_styled(doc, "Inicia la animación de desvanecimiento y oculta el elemento en el DOM tras 200 ms.", bold_prefix="_cerrarModal():")
    add_bullet_styled(doc, "Soporta cierre por botón ✕, clic en overlay y pulsación de la tecla Escape.", bold_prefix="_registrarEventosModal():")
    add_bullet_styled(doc, "Captura las coordenadas del centro del mapa y empaqueta el objeto del reporte.", bold_prefix="_enviarReporte():")
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        ["public/index.html", "Modificado", "+154 líneas", "Adición de la SECCIÓN 5 con la estructura completa del modal de reporte"],
        ["public/map.js", "Modificado", "+191 / -19 líneas", "Integración de métodos _abrirModal, _cerrarModal, eventos de teclado y formulario"],
        ["public/styles.css", "Modificado", "+32 líneas", "Animaciones de entrada y salida (.modal-visible, transform translateY y scale)"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "Al hacer clic en 'Tráfico', el modal abre con cabecera ámbar e ícono de semáforo.", bold_prefix="Prueba Tráfico:")
    add_bullet_styled(doc, "Al hacer clic en 'Incidencias', el modal abre con cabecera roja e ícono de alerta.", bold_prefix="Prueba Incidencias:")
    add_bullet_styled(doc, "El modal se cierra limpiamente al presionar la tecla Escape o hacer clic fuera de la tarjeta.", bold_prefix="Accesibilidad:")
    add_bullet_styled(doc, "La selección de archivos actualiza inmediatamente la etiqueta indicando cuántos archivos se adjuntaron.", bold_prefix="Adjuntos:")
    
    out_path = os.path.join(OUTPUT_DIR, "03_Commit_b9102eb_Modal_Registro_Reportes_Rapidos.docx")
    doc.save(out_path)
    print(f"Generado: {out_path}")

def generar_doc_4():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 4: VARIABLES DE ENTORNO Y BASE DE DATOS AIVEN",
        subtitle_text="Seguridad con .env, migración SQL, pool MySQL con SSL y API REST de reportes"
    )
    
    add_metadata_table(doc, {
        "Commit Hash": "9841bf4e5014d3e8c09d75a850db879029521220 (9841bf4)",
        "Fecha de Registro": "02 de Noviembre de 2026, 19:20:11 -05:00",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "Update database connection to use environment variables",
        "Tipo de Cambio": "Seguridad, Backend API y Persistencia en Base de Datos"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit introdujo la capa de persistencia real del sistema conectando el backend con una base de datos "
        "MySQL gestionada en Aiven Cloud. Al mismo tiempo, se aplicaron buenas prácticas de seguridad informática "
        "eliminando cualquier contraseña hardcodeada del código fuente, configurando dotenv, aislando credenciales "
        "en .env y garantizando que Git nunca rastree secretos mediante .gitignore.",
        bold_prefix="Objetivo General:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "Se adoptaron las siguientes medidas y patrones en backend y base de datos:",
        bold_prefix="Implementaciones Clave:"
    )
    add_bullet_styled(
        doc,
        "Instalación de paquete dotenv. Las credenciales de base de datos se consumen exclusivamente desde process.env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, PORT).",
        bold_prefix="Seguridad de Entorno:"
    )
    add_bullet_styled(
        doc,
        "El archivo .env quedó registrado en .gitignore para impedir su subida a GitHub. Se proveyó .env.example como plantilla pública para otros desarrolladores.",
        bold_prefix="Aislamiento Git:"
    )
    add_bullet_styled(
        doc,
        "Elaboración del script db/migracion_titulo.sql para ejecutar ALTER TABLE en Reporte y ReporteAnonimo añadiendo la columna titulo VARCHAR(120) NOT NULL DEFAULT ''.",
        bold_prefix="Migración de Esquema SQL:"
    )
    add_bullet_styled(
        doc,
        "Creación de db/test-conexion.js para comprobar conectividad TLS/SSL con el cluster Aiven.",
        bold_prefix="Diagnóstico de Red:"
    )
    add_bullet_styled(
        doc,
        "Configuración de pool con mysql2/promise, connectionLimit: 10 y ssl: { rejectUnauthorized: true } requerido por Aiven.",
        bold_prefix="Pool de Conexiones:"
    )
    add_bullet_styled(
        doc,
        "Creación del endpoint POST /api/reportes en server.js. Resuelve id_categoria e id_zona automáticamente (creándolas si no existen), extrae ip_origen del cliente e inserta el registro en ReporteAnonimo.",
        bold_prefix="Endpoint REST:"
    )
    add_bullet_styled(
        doc,
        "Modificación de UIController._enviarReporte() en map.js para realizar petición fetch() asíncrona, deshabilitar botón durante el envío y desplegar toast flotante de confirmación (verde para éxito, rojo para error).",
        bold_prefix="Integración Frontend:"
    )
    
    add_callout(
        doc,
        "El uso de un Connection Pool en lugar de una conexión única previene cuellos de botella bajo tráfico concurrente y asegura reconexión automática ante cortes temporales de red.",
        title="EFICIENCIA DE CONEXIÓN"
    )
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        [".gitignore", "Creación", "+17 líneas", "Exclusión de .env, node_modules y archivos temporales del control de versiones"],
        [".env.example", "Creación", "+12 líneas", "Plantilla pública de variables de entorno requeridas"],
        ["db/migracion_titulo.sql", "Creación", "+25 líneas", "Sentencias ALTER TABLE para soporte del campo título en BD"],
        ["db/test-conexion.js", "Creación", "+30 líneas", "Script de verificación de conexión segura hacia Aiven MySQL"],
        ["server.js", "Modificado", "+216 líneas", "Carga de dotenv, pool MySQL2 con SSL y endpoint POST /api/reportes"],
        ["public/map.js", "Modificado", "+284 / -18 líneas", "Envío asíncrono con fetch, estados de carga y notificaciones toast"],
        ["package.json", "Modificado", "+5 / -1 líneas", "Adición de dependencias dotenv y scripts de ejecución start / dev"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "Escaneo con Select-String confirma cero ocurrencias de contraseñas en archivos rastreados.", bold_prefix="Seguridad:")
    add_bullet_styled(doc, "git status confirma que .env permanece invisible e ignorado por Git.", bold_prefix="Git Status:")
    add_bullet_styled(doc, "Verificación de sintaxis limpia mediante `node --check server.js` y `node --check public/map.js`.", bold_prefix="Sintaxis:")
    
    out_path = os.path.join(OUTPUT_DIR, "04_Commit_9841bf4_Variables_Entorno_y_Base_Datos_Aiven.docx")
    doc.save(out_path)
    print(f"Generado: {out_path}")

def generar_doc_5():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 5: MERGE Y SINCRONIZACIÓN CON GITHUB",
        subtitle_text="Resolución de conflictos y consolidación de la rama principal main"
    )
    
    add_metadata_table(doc, {
        "Commit Hash": "1225f37d3c5d1979bcec9f396f99292138b43395 (1225f37)",
        "Fecha de Registro": "02 de Noviembre de 2026, 19:21:31 -05:00",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "Merge branch 'main' of https://github.com/ewaradrian/playa-alerta-vs",
        "Tipo de Cambio": "Gestión de Ramas y Sincronización de Versiones (Git Merge)"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit documenta una operación crítica de gestión de versiones: la resolución de una divergencia entre "
        "el repositorio remoto en GitHub y el árbol de desarrollo local. Durante el proceso de actualización de variables "
        "de entorno, existían commits paralelos que causaron un conflicto de contenido en public/map.js, el cual fue "
        "resuelto preservando la versión local con todas las capacidades de integración con la base de datos.",
        bold_prefix="Objetivo General:"
    )
    
    add_section_heading(doc, "2. Proceso Técnico de Resolución")
    add_paragraph_styled(
        doc,
        "El ciclo de integración siguió los siguientes pasos técnicos:",
        bold_prefix="Flujo de Integración:"
    )
    add_bullet_styled(
        doc,
        "Al intentar ejecutar `git push origin main`, el servidor de Git rechazó la actualización con error non-fast-forward debido a que el árbol remoto contenía cambios no integrados.",
        bold_prefix="Diagnóstico del Rechazo:"
    )
    add_bullet_styled(
        doc,
        "Se ejecutó `git pull origin main --no-rebase` para unificar las historias. Git detectó un conflicto de contenido en el archivo public/map.js.",
        bold_prefix="Integración de Historias:"
    )
    add_bullet_styled(
        doc,
        "Se aplicó la estrategia `git checkout --ours public/map.js` para asegurar que las nuevas funciones de consumo de la API REST (/api/reportes) y el componente toast no fueran sobreescritos por la versión previa del repositorio remoto.",
        bold_prefix="Resolución del Conflicto:"
    )
    add_bullet_styled(
        doc,
        "Se añadió el archivo resuelto a staging (`git add public/map.js`) y se generó el commit de merge correspondiente.",
        bold_prefix="Consolidación:"
    )
    add_bullet_styled(
        doc,
        "El posterior push hacia GitHub (`git push origin main`) completó la subida exitosamente con código de salida 0.",
        bold_prefix="Sincronización Exitosa:"
    )
    
    add_callout(
        doc,
        "La resolución controlada mediante '--ours' evitó la regresión de código hacia versiones previas del frontend y mantuvo la integridad de la conexión con Aiven MySQL.",
        title="BUENA PRÁCTICA"
    )
    
    add_section_heading(doc, "3. Archivos Involucrados en el Merge")
    archivos = [
        ["public/map.js", "Conflicto Resuelto", "Consolidado", "Resolución a favor de la versión que incluye fetch hacia /api/reportes"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "`git status` confirma: 'Your branch is up to date with origin/main'.", bold_prefix="Estado de Git:")
    add_bullet_styled(doc, "El historial de commits de Git quedó lineal y accesible desde GitHub.", bold_prefix="Integridad:")
    
    out_path = os.path.join(OUTPUT_DIR, "05_Commit_1225f37_Merge_Sincronizacion_GitHub.docx")
    doc.save(out_path)
    print(f"Generado: {out_path}")

def generar_doc_6():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 6: REPORTE POR CLICK EN MAPA Y STATUS Y/N",
        subtitle_text="Marcador animado (Map Point), selector de estado interactivo y renderizado de reportes"
    )
    
    add_metadata_table(doc, {
        "Commit Hash": "93266b57701409e547fbbe5cb8d7e0db3b67c214 (93266b5)",
        "Fecha de Registro": "02 de Noviembre de 2026, 19:41:00 -05:00",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "Add map point click to report with Status Y/N selector",
        "Tipo de Cambio": "Nueva Característica Funcional y Rediseño de Formulario"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit implementó la funcionalidad central solicitada por el usuario en el diagrama de 'CLICKABLE ELEMENTS': "
        "permitir que el usuario haga clic en cualquier coordenada exacta del mapa ('MAP POINT') para reportar un incidente "
        "directamente en esa ubicación. Además, se rediseñó el formulario para incorporar pestañas de selección de "
        "categoría (Incidencia / Tráfico) y los botones interactivos de estado STATUS: [ Y ] [ N ].",
        bold_prefix="Objetivo General:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "Se implementaron innovaciones técnicas tanto en la capa cartográfica como en el formulario y la base de datos:",
        bold_prefix="Novedades Técnicas:"
    )
    add_bullet_styled(
        doc,
        "En MapController se agregaron los métodos colocarPunto(latlng) y removerPunto(). El punto se dibuja utilizando un L.divIcon personalizado con animación CSS de radar pulsante (@keyframes pulseRadar), formado por un núcleo central (.map-point-center) y ondas expansivas translúcidas (.map-point-pulse).",
        bold_prefix="Punto Dinámico (MAP POINT):"
    )
    add_bullet_styled(
        doc,
        "UIController suscribe el evento mapa.on('click'). Al detectar un clic, extrae las coordenadas exactas e invoca _abrirModal('incidencia', latlng), asignando las coordenadas del punto clickeado como origen del reporte.",
        bold_prefix="Detección de Click:"
    )
    add_bullet_styled(
        doc,
        "Se incorporó en public/index.html un componente con dos botones ergonómicos: 'Y' (Activo / Sí, resaltado en verde .active-y) y 'N' (Resuelto / No, resaltado en rojo .active-n), acompañados de la etiqueta 'STATUS' tal como en el boceto.",
        bold_prefix="Selector STATUS [ Y ] [ N ]:"
    )
    add_bullet_styled(
        doc,
        "Pestañas en la cabecera (#tabTipoIncidencia y #tabTipoTrafico) que permiten alternar la categoría sobre la marcha, actualizando colores, íconos y validaciones.",
        bold_prefix="Pestañas de Categoría:"
    )
    add_bullet_styled(
        doc,
        "Creación de una capa L.layerGroup() (capaReportes). Al confirmar el reporte, el MAP POINT temporal se retira y se añade un marcador permanente estilizado con ícono y popup descriptivo. Además, se creó el endpoint GET /api/reportes en server.js para recuperar los reportes existentes de MySQL y pintarlos al iniciar.",
        bold_prefix="Marcadores Permanentes:"
    )
    add_bullet_styled(
        doc,
        "server.js ahora acepta el campo 'estado' en el body de POST /api/reportes, normalizándolo hacia 'activo' o 'resuelto'.",
        bold_prefix="Actualización de API REST:"
    )
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        ["public/index.html", "Modificado", "+66 líneas", "Adición de badge de coordenadas, tabs de tipo y botones STATUS [Y] [N]"],
        ["public/map.js", "Modificado", "+616 / -263 líneas", "Control de puntos de click, eventos de mapa, marcadores confirmados y estado"],
        ["public/styles.css", "Modificado", "+121 líneas", "Efecto de radar pulsante (.map-point-pulse) y botones .status-toggle-btn"],
        ["server.js", "Modificado", "+57 / -20 líneas", "Endpoint GET /api/reportes y soporte de campo 'estado' en POST /api/reportes"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "Al hacer clic en cualquier calle del mapa, aparece el radar rojo pulsante y abre el formulario.", bold_prefix="Prueba de Click:")
    add_bullet_styled(doc, "El badge de cabecera refleja las coordenadas exactas con precisión de 4 decimales.", bold_prefix="Precisión:")
    add_bullet_styled(doc, "Al seleccionar 'Y' o 'N', los botones cambian de color adecuadamente (verde / rojo).", bold_prefix="Toggle Status:")
    add_bullet_styled(doc, "Al enviar, el reporte se inserta en Aiven MySQL con el estado elegido y aparece el pin en el mapa.", bold_prefix="Persistencia:")
    add_bullet_styled(doc, "Si el usuario cancela con la tecla Escape, el punto temporal del mapa se borra sin dejar residuos.", bold_prefix="Limpieza:")
    
    out_path = os.path.join(OUTPUT_DIR, "06_Commit_93266b5_Reporte_Click_Mapa_y_Status_YN.docx")
    doc.save(out_path)
    print(f"Generado: {out_path}")

def generar_doc_7():
    doc = create_base_doc()
    add_header_banner(
        doc,
        title_text="COMMIT 7: PERFIL DE USUARIO Y ADAPTACIÓN MÓVIL",
        subtitle_text="Panel con historial de reportes (Aiven MySQL) y diseño responsive vertical para smartphones"
    )
    
    add_metadata_table(doc, {
        "Commit Hash": "a883b35e34f0b1c9b33264d2ec9872c075d6f9b4 (a883b35)",
        "Fecha de Registro": "02 de Noviembre de 2026, 19:52:41 -05:00",
        "Autor / Committer": "ewaradrian <ewaradrian@gmail.com>",
        "Rama": "main",
        "Mensaje de Commit": "Add user profile panel with report history and mobile responsive layout",
        "Tipo de Cambio": "Nueva Característica de Perfil y Optimización Responsive Móvil"
    })
    
    add_section_heading(doc, "1. Resumen Ejecutivo")
    add_paragraph_styled(
        doc,
        "Este commit completó dos requerimientos esenciales solicitados mediante referencias visuales: "
        "1) La implementación del panel modal de Perfil de Usuario (#userProfileModal) con la estructura exacta "
        "indicada en el wireframe (USER ICON, USERNAME, USER STATUS BAR y REPORT HISTORY con listado interactivo). "
        "2) La adaptación responsiva completa para dispositivos móviles (smartphones) ilustrada en el diagrama comparativo, "
        "reubicando el menú de reporte rápido en la parte inferior central en formato de píldora ergonómica táctil.",
        bold_prefix="Objetivo General:"
    )
    
    add_section_heading(doc, "2. Arquitectura y Componentes Técnicos")
    add_paragraph_styled(
        doc,
        "La solución se dividió en dos áreas arquitectónicas:",
        bold_prefix="Componentes Implementados:"
    )
    add_bullet_styled(
        doc,
        "Avatar circular de 64x64 px en azul marino (#003366) con silueta vectorial y punto de estado verde activo. A su derecha, tarjeta con nombre 'Ciudadano Playa', correo 'ciudadano@playa.gob.mx', insignia de cuenta verificada y rol cívico.",
        bold_prefix="Bloque USER ICON + USERNAME:"
    )
    add_bullet_styled(
        doc,
        "Barra visual que muestra el estado de la cuenta ('● Activa / Confiable') y una barra de progreso que ilustra la reputación cívica ('85% Nivel 1'), alineada con el modelo de datos de la plataforma.",
        bold_prefix="Bloque USER STATUS BAR:"
    )
    add_bullet_styled(
        doc,
        "Contenedor scrollable con barra de desplazamiento personalizada. Consulta asíncronamente GET /api/reportes y renderiza tarjetas individuales con categoría (Tráfico / Incidencia), título, descripción, coordenadas y estado. Cada tarjeta incluye el botón 'Ver', el cual cierra el perfil y realiza una transición animada suave (mapa.flyTo([lat, lng], 16)) enfocando el punto exacto en el mapa.",
        bold_prefix="Bloque REPORT HISTORY:"
    )
    add_bullet_styled(
        doc,
        "En pantallas móviles (ancho <= 640px), el panel #quickReportMenu pasa de estar anclado a la derecha a ubicarse centrado horizontalmente en la parte inferior (bottom-4 left-1/2 -translate-x-1/2), formando una cápsula ergonómica idéntica a la referencia. El logotipo adopta dimensiones compactas para evitar solapamientos.",
        bold_prefix="Diseño Responsive Móvil:"
    )
    add_bullet_styled(
        doc,
        "En móviles, el control de zoom nativo de Leaflet se reubica automáticamente en la esquina superior derecha (debajo del botón de usuario) evitando colisiones con el menú inferior centrado.",
        bold_prefix="Ajuste de Controles de Mapa:"
    )
    add_bullet_styled(
        doc,
        "Tanto el modal de reporte como el de perfil cuentan con límites max-h-[90vh] / max-h-[92vh] y overflow-y-auto, garantizando desplazamiento táctil sin desbordar la pantalla del teléfono.",
        bold_prefix="Scroll Táctil Móvil:"
    )
    
    add_callout(
        doc,
        "La navegación espacial desde el Historial hacia el mapa (flyTo) unifica la experiencia de usuario: el ciudadano puede consultar sus reportes pasados y verificar inmediatamente su ubicación geográfica con un solo toque.",
        title="EXPERIENCIA DE USUARIO (UX)"
    )
    
    add_section_heading(doc, "3. Archivos del Proyecto Impactados")
    archivos = [
        ["public/index.html", "Modificado", "+215 / -37 líneas", "Estructura del modal #userProfileModal, clases de centrado responsive y mejoras de accesibilidad"],
        ["public/map.js", "Modificado", "+184 líneas", "Gestión de perfil, consulta de historial a MySQL, y navegación espacial flyTo()"],
        ["public/styles.css", "Modificado", "+72 líneas", "Animaciones de apertura de perfil, scrollbar estilizado y media queries móviles (@media max-width: 640px)"]
    ]
    add_files_table(doc, archivos)
    
    add_section_heading(doc, "4. Pruebas y Criterios de Aceptación")
    add_bullet_styled(doc, "Al hacer clic en el botón de usuario superior derecho, abre el perfil de usuario con animación suave.", bold_prefix="Apertura Perfil:")
    add_bullet_styled(doc, "El historial muestra el conteo real y renderiza los reportes obtenidos de Aiven MySQL.", bold_prefix="Carga de Historial:")
    add_bullet_styled(doc, "Al presionar 'Ver' en un reporte, el perfil se cierra y el mapa vuela fluidamente a las coordenadas.", bold_prefix="Vuelo de Mapa:")
    add_bullet_styled(doc, "En simulación móvil (375x667 px y 414x896 px), el menú inferior queda centrado en forma de cápsula y los modales son completamente desplazables.", bold_prefix="Validación Móvil:")
    
    out_path = os.path.join(OUTPUT_DIR, "07_Commit_a883b35_Perfil_Usuario_y_Adaptacion_Movil.docx")
    doc.save(out_path)
    print(f"Generado: {out_path}")

if __name__ == "__main__":
    print("Iniciando generación de los 7 documentos .docx...")
    generar_doc_1()
    generar_doc_2()
    generar_doc_3()
    generar_doc_4()
    generar_doc_5()
    generar_doc_6()
    generar_doc_7()
    print("¡Todos los documentos .docx han sido generados exitosamente!")
