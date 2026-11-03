/**
 * =============================================================
 * ARCHIVO: map.js
 * PROYECTO: Playa Alerta
 * DESCRIPCIÓN: Módulo principal de la aplicación con arquitectura OOP:
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  MapController   → gestiona el mapa Leaflet y marcadores│
 *   │  UIController    → gestiona modales, formularios y clicks│
 *   │  PlayaAlertaApp  → orquesta el arranque de la app       │
 *   └────────────────────────────────────────────────────────┘
 *
 * DEPENDENCIAS: Leaflet.js (debe cargarse antes que este script)
 * AUTOR: Equipo Playa Alerta
 * ÚLTIMA ACTUALIZACIÓN: 2026-11-02
 * =============================================================
 */

'use strict';


/* =============================================================
   CLASE 1 — MapController
   Responsabilidad única: todo lo relacionado con el mapa
   interactivo (Leaflet), capas de teselas, punto temporal de click
   ("MAP POINT") y marcadores persistentes de reportes.
   ============================================================= */

class MapController {

    /**
     * Constructor — define la configuración inicial del mapa.
     * @param {string} elementId - ID del elemento HTML que contendrá el mapa.
     */
    constructor(elementId) {
        this.elementId = elementId;

        /* Coordenadas [latitud, longitud] del centro de Playa del Carmen */
        this.centroPlaya = [20.6296, -87.0739];

        /* Zoom inicial y límites */
        this.zoomInicial = 14;
        this.minZoom     = 12;
        this.maxZoom     = 18;

        /* Límites geográficos (Quintana Roo) */
        this.limiteGeografico = L.latLngBounds(
            [20.3000, -87.4000],
            [20.8000, -86.8000]
        );

        this.urlTeselas = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        this.atribucion = '&copy; OpenStreetMap contributors — Playa Alerta';

        /* Instancia del mapa Leaflet */
        this.mapa = null;

        /* Marcador temporal para el punto seleccionado ("MAP POINT") */
        this.marcadorPunto = null;

        /* Grupo de capas para los reportes confirmados en el mapa */
        this.capaReportes = null;
    }

    /**
     * inicializar()
     * Instancia el mapa de Leaflet en el DOM y carga capas y reportes existentes.
     * @returns {L.Map} - La instancia de Leaflet.
     */
    inicializar() {
        this.mapa = L.map(this.elementId, {
            center:             this.centroPlaya,
            zoom:               this.zoomInicial,
            minZoom:            this.minZoom,
            maxZoom:            this.maxZoom,
            maxBounds:          this.limiteGeografico,
            maxBoundsViscosity: 1.0,
            zoomControl:        false
        });

        /* Control de zoom en esquina inferior derecha */
        L.control.zoom({ position: 'bottomright' }).addTo(this.mapa);

        /* Capa base OpenStreetMap */
        this._agregarCapaTeselas();

        /* Capa para reportes en el mapa */
        this.capaReportes = L.layerGroup().addTo(this.mapa);

        /* Carga los reportes previamente guardados desde la BD */
        this.cargarReportesExistentes();

        console.log('[MapController] Mapa y capas inicializados correctamente.');
        return this.mapa;
    }

    /**
     * _agregarCapaTeselas() [privado]
     */
    _agregarCapaTeselas() {
        L.tileLayer(this.urlTeselas, {
            attribution:    this.atribucion,
            updateWhenIdle: true,
            keepBuffer:     2
        }).addTo(this.mapa);
    }

    /**
     * colocarPunto(latlng)
     * Coloca o mueve el marcador animado de selección ("MAP POINT")
     * en las coordenadas indicadas al hacer click en el mapa.
     *
     * @param {L.LatLng} latlng - Coordenadas del click.
     * @returns {L.Marker}      - Instancia del marcador creado.
     */
    colocarPunto(latlng) {
        this.removerPunto();

        const puntoIcon = L.divIcon({
            className: 'map-point-icon',
            html: '<div class="map-point-pulse"></div><div class="map-point-center"></div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        this.marcadorPunto = L.marker(latlng, {
            icon: puntoIcon,
            zIndexOffset: 1000
        }).addTo(this.mapa);

        return this.marcadorPunto;
    }

    /**
     * removerPunto()
     * Elimina el marcador temporal de selección si existe.
     */
    removerPunto() {
        if (this.marcadorPunto) {
            this.mapa.removeLayer(this.marcadorPunto);
            this.marcadorPunto = null;
        }
    }

    /**
     * agregarMarcadorConfirmado(reporte)
     * Renderiza un marcador definitivo para un reporte guardado en BD.
     *
     * @param {Object} reporte - Datos del reporte {latitud, longitud, tipo, titulo, descripcion, estado}
     */
    agregarMarcadorConfirmado(reporte) {
        const lat = parseFloat(reporte.latitud);
        const lng = parseFloat(reporte.longitud);

        if (isNaN(lat) || isNaN(lng)) return;

        const esTrafico = (reporte.tipo === 'trafico' || reporte.categoria === 'Tráfico');
        const colorBg   = esTrafico ? '#F59E0B' : '#EF4444'; /* amber-500 | red-500 */
        const iconoSvg  = esTrafico
            ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C9.24 2 7 4.24 7 7v10c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11.5 12 11.5zm0-5c-.83 0-1.5-.67-1.5-1.5S11.17 4 12 4s1.5.67 1.5 1.5S12.83 6.5 12 6.5z"/></svg>'
            : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';

        const customIcon = L.divIcon({
            className: 'report-confirmed-icon',
            html: `<div style="background-color:${colorBg}; width:100%; height:100%; border-radius:50%; display:flex; align-items:center; justify-content:center;">${iconoSvg}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const estadoBadge = reporte.estado === 'activo'
            ? '<span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:999px; font-weight:700;">Activo</span>'
            : '<span style="background:#fee2e2; color:#b91c1c; padding:2px 8px; border-radius:999px; font-weight:700;">Resuelto</span>';

        const popupHtml = `
            <div style="font-family:system-ui,sans-serif; min-width:180px; max-width:240px; padding:4px;">
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; font-weight:700; margin-bottom:4px;">
                    ${esTrafico ? 'Tráfico' : 'Incidencia Vial'} • ${estadoBadge}
                </div>
                <div style="font-weight:800; font-size:14px; color:#111827; margin-bottom:4px;">
                    ${reporte.titulo || 'Sin título'}
                </div>
                <div style="font-size:12px; color:#4b5563; line-height:1.4;">
                    ${reporte.descripcion || 'Sin descripción'}
                </div>
            </div>
        `;

        const marker = L.marker([lat, lng], { icon: customIcon })
            .bindPopup(popupHtml);

        this.capaReportes.addLayer(marker);
        return marker;
    }

    /**
     * cargarReportesExistentes()
     * Consulta al backend GET /api/reportes para mostrar los puntos registrados.
     */
    async cargarReportesExistentes() {
        try {
            const res = await fetch('/api/reportes');
            const data = await res.json();
            if (data.ok && Array.isArray(data.reportes)) {
                data.reportes.forEach((r) => this.agregarMarcadorConfirmado(r));
                console.log(`[MapController] ${data.reportes.length} reportes cargados en el mapa.`);
            }
        } catch (error) {
            console.warn('[MapController] No se pudieron cargar los reportes previos:', error.message);
        }
    }

    getMapa() {
        return this.mapa;
    }
}


/* =============================================================
   CLASE 2 — UIController
   Responsabilidad: gestionar eventos del usuario, formularios,
   click en el mapa para registrar reportes, botones de STATUS
   (Y / N) y comunicación con la API.
   ============================================================= */

class UIController {

    /**
     * @param {L.Map} mapa                  - Instancia de Leaflet.
     * @param {MapController} mapController - Controlador del mapa para colocar/quitar puntos.
     */
    constructor(mapa, mapController) {
        this.mapa          = mapa;
        this.mapController = mapController;

        /* Botones de navegación / reporte rápido */
        this.btnUsuario    = document.getElementById('btnUsuario');
        this.btnTrafico    = document.getElementById('btnTrafico');
        this.btnIncidencia = document.getElementById('btnIncidencia');

        /* Elementos del modal de reporte */
        this.reportModal        = document.getElementById('reportModal');
        this.modalOverlay       = document.getElementById('modalOverlay');
        this.btnCerrarModal     = document.getElementById('btnCerrarModal');
        this.modalHeader        = document.getElementById('modalHeader');
        this.modalIcon          = document.getElementById('modalIcon');
        this.modalTitle         = document.getElementById('modalTitle');
        this.modalCoordsBadge   = document.getElementById('modalCoordsBadge');
        this.tabTipoIncidencia  = document.getElementById('tabTipoIncidencia');
        this.tabTipoTrafico     = document.getElementById('tabTipoTrafico');

        /* Elementos del modal de perfil de usuario */
        this.userProfileModal         = document.getElementById('userProfileModal');
        this.perfilOverlay            = document.getElementById('perfilOverlay');
        this.btnCerrarPerfil          = document.getElementById('btnCerrarPerfil');
        this.btnCerrarPerfilSecundario= document.getElementById('btnCerrarPerfilSecundario');
        this.historialReportesLista   = document.getElementById('historialReportesLista');
        this.historialContador        = document.getElementById('historialContador');
        this.btnRecargarHistorial     = document.getElementById('btnRecargarHistorial');

        /* Campos del formulario */
        this.reportForm         = document.getElementById('reportForm');
        this.inputTitulo        = document.getElementById('inputTitulo');
        this.inputDescripcion   = document.getElementById('inputDescripcion');
        this.inputAdjuntos      = document.getElementById('inputAdjuntos');
        this.adjuntosTexto      = document.getElementById('adjuntosTexto');
        this.btnStatusY         = document.getElementById('btnStatusY');
        this.btnStatusN         = document.getElementById('btnStatusN');
        this.inputStatus        = document.getElementById('inputStatus');
        this.btnEnviarReporte   = document.getElementById('btnEnviarReporte');

        /* Configuración visual por categoría */
        this.tiposReporte = {
            trafico: {
                label:    'Tráfico',
                color:    '#D97706', /* amber-600 */
                colorBtn: '#F59E0B', /* amber-400 */
                ring:     'focus:ring-amber-400',
                svgPath:
                    'M12 2C9.24 2 7 4.24 7 7v10c0 2.76 2.24 5 5 5s5-2.24 ' +
                    '5-5V7c0-2.76-2.24-5-5-5zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 ' +
                    '1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-5c-.83 ' +
                    '0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11.5 12 ' +
                    '11.5zm0-5c-.83 0-1.5-.67-1.5-1.5S11.17 4 12 4s1.5.67 1.5 1.5S12.83 6.5 12 6.5z'
            },
            incidencia: {
                label:    'Incidencia Vial',
                color:    '#DC2626', /* red-600 */
                colorBtn: '#EF4444', /* red-500 */
                ring:     'focus:ring-red-400',
                svgPath:
                    'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'
            }
        };

        /* Estado interno */
        this._tipoActivo            = 'incidencia';
        this._coordenadasActivas    = null;
        this._reporteGuardadoExito  = false;
    }

    /**
     * inicializar()
     * Registra todos los escuchadores de eventos.
     */
    inicializar() {
        this._registrarEventoUsuario();
        this._registrarEventosPerfil();
        this._registrarEventoTrafico();
        this._registrarEventoIncidencia();
        this._registrarEventoClickMapa();
        this._registrarEventosModal();
        this._registrarEventosStatus();
        this._registrarEventosTabsTipo();

        console.log('[UIController] Eventos de interfaz y clicks de mapa registrados.');
    }

    /**
     * _registrarEventoClickMapa() [privado]
     * Permite hacer click en cualquier punto del mapa para abrir el formulario
     * directamente en esa ubicación exacta ("MAP POINT").
     */
    _registrarEventoClickMapa() {
        if (!this.mapa) return;

        this.mapa.on('click', (e) => {
            const latlng = e.latlng;
            console.log(`[UIController] Click en mapa → Lat: ${latlng.lat.toFixed(6)}, Lng: ${latlng.lng.toFixed(6)}`);

            /* 1. Coloca el marcador animado MAP POINT en el mapa */
            if (this.mapController) {
                this.mapController.colocarPunto(latlng);
            }

            /* 2. Abre el modal de reporte configurado con esas coordenadas */
            this._abrirModal('incidencia', latlng);
        });
    }

    /**
     * _registrarEventoUsuario() [privado]
     * Al hacer click en el avatar, despliega el panel de perfil de usuario.
     */
    _registrarEventoUsuario() {
        if (!this.btnUsuario) return;

        this.btnUsuario.addEventListener('click', () => {
            console.log('[UIController] Botón de usuario presionado. Abriendo perfil...');
            this._abrirPerfil();
        });
    }

    /**
     * _registrarEventosPerfil() [privado]
     * Listeners para cerrar o actualizar el modal del perfil.
     */
    _registrarEventosPerfil() {
        if (this.btnCerrarPerfil) {
            this.btnCerrarPerfil.addEventListener('click', () => this._cerrarPerfil());
        }
        if (this.btnCerrarPerfilSecundario) {
            this.btnCerrarPerfilSecundario.addEventListener('click', () => this._cerrarPerfil());
        }
        if (this.perfilOverlay) {
            this.perfilOverlay.addEventListener('click', () => this._cerrarPerfil());
        }
        if (this.btnRecargarHistorial) {
            this.btnRecargarHistorial.addEventListener('click', () => this._cargarHistorialReportes());
        }

        /* Cerrar con Escape */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.userProfileModal && !this.userProfileModal.classList.contains('hidden')) {
                this._cerrarPerfil();
            }
        });
    }

    /**
     * _abrirPerfil() [privado]
     * Muestra el modal de perfil con animación y carga el historial de reportes.
     */
    _abrirPerfil() {
        if (!this.userProfileModal) return;

        this.userProfileModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.userProfileModal.classList.add('modal-visible');
        });

        this._cargarHistorialReportes();
    }

    /**
     * _cerrarPerfil() [privado]
     */
    _cerrarPerfil() {
        if (!this.userProfileModal) return;

        this.userProfileModal.classList.remove('modal-visible');
        setTimeout(() => {
            this.userProfileModal.classList.add('hidden');
        }, 200);

        console.log('[UIController] Perfil de usuario cerrado.');
    }

    /**
     * _cargarHistorialReportes() [privado]
     * Consulta los reportes en la base de datos para renderizarlos en la lista de REPORT HISTORY.
     */
    async _cargarHistorialReportes() {
        if (!this.historialReportesLista) return;

        this.historialReportesLista.innerHTML = `
            <div class="py-6 flex flex-col items-center justify-center text-gray-400 gap-2">
                <svg class="w-6 h-6 animate-spin text-[#003366]" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span class="text-xs font-semibold text-gray-500">Cargando historial de reportes...</span>
            </div>
        `;

        try {
            const res = await fetch('/api/reportes');
            const data = await res.json();

            if (!data.ok || !Array.isArray(data.reportes) || data.reportes.length === 0) {
                if (this.historialContador) this.historialContador.textContent = '0';
                this.historialReportesLista.innerHTML = `
                    <div class="p-6 text-center text-gray-400 flex flex-col items-center gap-2 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <svg class="w-8 h-8 opacity-40 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p class="text-xs font-bold text-gray-600">No hay reportes registrados aún</p>
                        <p class="text-[11px] text-gray-400">Haz click en el mapa para reportar una incidencia o tráfico.</p>
                    </div>
                `;
                return;
            }

            if (this.historialContador) {
                this.historialContador.textContent = data.reportes.length;
            }

            this.historialReportesLista.innerHTML = '';

            data.reportes.forEach((rep) => {
                const esTrafico = (rep.categoria === 'Tráfico' || rep.tipo === 'trafico');
                const esActivo  = (rep.estado === 'activo' || rep.estado === 'Y');

                const item = document.createElement('div');
                item.className = 'p-3 bg-gray-50 hover:bg-gray-100/90 rounded-2xl border border-gray-100 transition-all flex items-start justify-between gap-2.5';

                item.innerHTML = `
                    <div class="flex items-start gap-2.5 min-w-0">
                        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${esTrafico ? 'bg-amber-500' : 'bg-red-500'}">
                            ${esTrafico
                                ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C9.24 2 7 4.24 7 7v10c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11.5 12 11.5zm0-5c-.83 0-1.5-.67-1.5-1.5S11.17 4 12 4s1.5.67 1.5 1.5S12.83 6.5 12 6.5z"/></svg>'
                                : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
                            }
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <h4 class="font-extrabold text-xs text-gray-800 truncate">
                                    ${rep.titulo || 'Sin título'}
                                </h4>
                                <span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${esActivo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}">
                                    ${esActivo ? 'Activo' : 'Resuelto'}
                                </span>
                            </div>
                            <p class="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                ${rep.descripcion || 'Sin descripción detallada'}
                            </p>
                            <span class="text-[10px] text-gray-400 font-mono">
                                📍 ${Number(rep.latitud).toFixed(4)}, ${Number(rep.longitud).toFixed(4)}
                            </span>
                        </div>
                    </div>

                    <button type="button"
                            class="btn-ver-mapa flex-shrink-0 px-2.5 py-1 text-[11px] font-extrabold text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Centrar en el mapa">
                        Ver
                    </button>
                `;

                const btnVer = item.querySelector('.btn-ver-mapa');
                if (btnVer) {
                    btnVer.addEventListener('click', () => {
                        this._centrarEnReporte(parseFloat(rep.latitud), parseFloat(rep.longitud));
                    });
                }

                this.historialReportesLista.appendChild(item);
            });

        } catch (error) {
            console.error('[UIController] Error al cargar historial:', error);
            this.historialReportesLista.innerHTML = `
                <div class="p-4 text-center text-red-500 text-xs">
                    Error al cargar los reportes desde la base de datos.
                </div>
            `;
        }
    }

    /**
     * _centrarEnReporte(lat, lng) [privado]
     * Cierra el modal de perfil y vuela el mapa suavemente al punto del reporte.
     */
    _centrarEnReporte(lat, lng) {
        if (isNaN(lat) || isNaN(lng)) return;
        this._cerrarPerfil();
        this.mapa.flyTo([lat, lng], 16, {
            animate: true,
            duration: 1.2
        });
    }

    /**
     * _registrarEventoTrafico() [privado]
     * Botón de reporte rápido de Tráfico.
     */
    _registrarEventoTrafico() {
        if (!this.btnTrafico) return;

        this.btnTrafico.addEventListener('click', () => {
            const centro = this.mapa.getCenter();
            if (this.mapController) {
                this.mapController.colocarPunto(centro);
            }
            this._abrirModal('trafico', centro);
        });
    }

    /**
     * _registrarEventoIncidencia() [privado]
     * Botón de reporte rápido de Incidencias.
     */
    _registrarEventoIncidencia() {
        if (!this.btnIncidencia) return;

        this.btnIncidencia.addEventListener('click', () => {
            const centro = this.mapa.getCenter();
            if (this.mapController) {
                this.mapController.colocarPunto(centro);
            }
            this._abrirModal('incidencia', centro);
        });
    }

    /**
     * _registrarEventosTabsTipo() [privado]
     * Permite alternar entre "Incidencia Vial" y "Tráfico" dentro del modal.
     */
    _registrarEventosTabsTipo() {
        if (this.tabTipoIncidencia) {
            this.tabTipoIncidencia.addEventListener('click', () => this._cambiarTipo('incidencia'));
        }
        if (this.tabTipoTrafico) {
            this.tabTipoTrafico.addEventListener('click', () => this._cambiarTipo('trafico'));
        }
    }

    /**
     * _cambiarTipo(tipo) [privado]
     * Actualiza el tipo activo y el diseño visual del modal.
     */
    _cambiarTipo(tipo) {
        this._tipoActivo = tipo;
        const cfg = this.tiposReporte[tipo];
        if (!cfg) return;

        /* Actualiza cabecera */
        this.modalHeader.style.backgroundColor = cfg.color;
        this.modalTitle.textContent            = cfg.label;
        this.btnEnviarReporte.style.backgroundColor = cfg.colorBtn;

        this.modalIcon.innerHTML = `
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="${cfg.svgPath}"/>
            </svg>`;

        /* Actualiza tabs visuales */
        if (tipo === 'incidencia') {
            this.tabTipoIncidencia.className =
                'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 bg-red-50 text-red-700 border-red-300';
            this.tabTipoTrafico.className =
                'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 border-gray-200';
        } else {
            this.tabTipoTrafico.className =
                'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 border-amber-300';
            this.tabTipoIncidencia.className =
                'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 bg-gray-100 text-gray-500 border-gray-200';
        }
    }

    /**
     * _registrarEventosStatus() [privado]
     * Gestiona los botones interactivos de STATUS:
     *   - Y = Activo / Sí
     *   - N = Resuelto / Inactivo / No
     */
    _registrarEventosStatus() {
        if (!this.btnStatusY || !this.btnStatusN || !this.inputStatus) return;

        this.btnStatusY.addEventListener('click', () => {
            this.inputStatus.value = 'Y';
            this.btnStatusY.classList.add('active-y');
            this.btnStatusN.classList.remove('active-n');
        });

        this.btnStatusN.addEventListener('click', () => {
            this.inputStatus.value = 'N';
            this.btnStatusN.classList.add('active-n');
            this.btnStatusY.classList.remove('active-y');
        });
    }

    /**
     * _registrarEventosModal() [privado]
     */
    _registrarEventosModal() {
        /* Cerrar con el botón ✕ */
        this.btnCerrarModal.addEventListener('click', () => this._cerrarModal());

        /* Cerrar haciendo click en el overlay oscuro */
        this.modalOverlay.addEventListener('click', () => this._cerrarModal());

        /* Cerrar con tecla Escape */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.reportModal.classList.contains('hidden')) {
                this._cerrarModal();
            }
        });

        /* Texto de archivos adjuntos */
        this.inputAdjuntos.addEventListener('change', () => {
            const n = this.inputAdjuntos.files.length;
            this.adjuntosTexto.textContent =
                n === 0 ? 'Toca para adjuntar foto o video'
              : n === 1 ? '1 archivo seleccionado'
              :           `${n} archivos seleccionados`;
        });

        /* Envío del formulario */
        this.reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this._enviarReporte();
        });
    }

    /**
     * _abrirModal(tipo, latlng) [privado]
     * Abre el modal configurado con la categoría y coordenadas seleccionadas.
     *
     * @param {string} tipo       - 'incidencia' | 'trafico'
     * @param {L.LatLng} [latlng] - Coordenadas del punto clickeado
     */
    _abrirModal(tipo, latlng) {
        this._reporteGuardadoExito = false;
        this._coordenadasActivas   = latlng || this.mapa.getCenter();

        /* Actualiza el badge con las coordenadas del punto */
        if (this.modalCoordsBadge && this._coordenadasActivas) {
            const lat = Number(this._coordenadasActivas.lat).toFixed(4);
            const lng = Number(this._coordenadasActivas.lng).toFixed(4);
            this.modalCoordsBadge.textContent = `📍 ${lat}, ${lng}`;
        }

        /* Aplica categoría y colores */
        this._cambiarTipo(tipo || 'incidencia');

        /* Restablece Status por defecto a 'Y' (Activo) */
        if (this.inputStatus && this.btnStatusY && this.btnStatusN) {
            this.inputStatus.value = 'Y';
            this.btnStatusY.classList.add('active-y');
            this.btnStatusN.classList.remove('active-n');
        }

        /* Limpia campos de texto */
        this.reportForm.reset();
        this.adjuntosTexto.textContent = 'Toca para adjuntar foto o video';

        /* Muestra el modal con animación */
        this.reportModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.reportModal.classList.add('modal-visible');
        });

        /* Foco en el primer campo */
        setTimeout(() => this.inputTitulo.focus(), 90);
    }

    /**
     * _cerrarModal() [privado]
     * Cierra el formulario. Si no se guardó un reporte, remueve el MAP POINT temporal.
     */
    _cerrarModal() {
        this.reportModal.classList.remove('modal-visible');

        setTimeout(() => {
            this.reportModal.classList.add('hidden');

            /* Si no se completó el envío, elimina el punto temporal del mapa */
            if (!this._reporteGuardadoExito && this.mapController) {
                this.mapController.removerPunto();
            }

            this._coordenadasActivas = null;
        }, 200);

        console.log('[UIController] Modal cerrado.');
    }

    /**
     * _enviarReporte() [privado]
     * Guarda el reporte en la base de datos de Aiven a través de POST /api/reportes.
     */
    async _enviarReporte() {
        const coords = this._coordenadasActivas || this.mapa.getCenter();
        const statusValue = this.inputStatus ? this.inputStatus.value : 'Y';

        const payload = {
            tipo:        this._tipoActivo,
            titulo:      this.inputTitulo.value.trim(),
            descripcion: this.inputDescripcion.value.trim(),
            latitud:     coords.lat.toFixed(6),
            longitud:    coords.lng.toFixed(6),
            estado:      statusValue === 'Y' ? 'activo' : 'resuelto'
        };

        /* Bloquea el botón de envío y da feedback */
        this.btnEnviarReporte.disabled    = true;
        this.btnEnviarReporte.textContent = 'Enviando…';

        try {
            const respuesta = await fetch('/api/reportes', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error(datos.mensaje || `HTTP ${respuesta.status}`);
            }

            console.log(`[UIController] Reporte guardado en Aiven MySQL → ID: ${datos.id}`);
            this._reporteGuardadoExito = true;

            /* Remueve el MAP POINT temporal y agrega el marcador definitivo */
            if (this.mapController) {
                this.mapController.removerPunto();
                this.mapController.agregarMarcadorConfirmado({
                    ...payload,
                    id_anonimo: datos.id,
                    categoria:  this._tipoActivo === 'trafico' ? 'Tráfico' : 'Incidencia Vial'
                });
            }

            this._mostrarFeedback('¡Reporte registrado en el punto del mapa!', 'exito');
            this._cerrarModal();

        } catch (error) {
            console.error('[UIController] Error al guardar reporte:', error.message);
            this._mostrarFeedback(`No se pudo guardar: ${error.message}`, 'error');

        } finally {
            this.btnEnviarReporte.disabled    = false;
            this.btnEnviarReporte.textContent = 'Enviar Reporte';
        }
    }

    /**
     * _mostrarFeedback(mensaje, tipo) [privado]
     */
    _mostrarFeedback(mensaje, tipo) {
        const anterior = document.getElementById('toastFeedback');
        if (anterior) anterior.remove();

        const color = tipo === 'exito' ? '#16a34a' : '#dc2626';

        const toast = document.createElement('div');
        toast.id = 'toastFeedback';
        toast.textContent = mensaje;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(80px);
            background: ${color};
            color: #fff;
            font-size: 0.85rem;
            font-weight: 700;
            padding: 12px 24px;
            border-radius: 999px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.35);
            z-index: 9999;
            transition: transform 0.25s ease, opacity 0.25s ease;
            opacity: 0;
            white-space: nowrap;
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
            toast.style.opacity   = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(80px)';
            toast.style.opacity   = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
}


/* =============================================================
   CLASE 3 — PlayaAlertaApp
   ============================================================= */

class PlayaAlertaApp {

    constructor() {
        this.mapController = new MapController('map');
        this.uiController  = null;
    }

    arrancar() {
        console.log('[PlayaAlertaApp] Iniciando Playa Alerta...');

        /* 1. Inicializa el mapa interactivo */
        const mapaLeaflet = this.mapController.inicializar();

        /* 2. Pasa tanto el mapa como el MapController al UIController */
        this.uiController = new UIController(mapaLeaflet, this.mapController);

        /* 3. Registra eventos de UI y clicks del mapa */
        this.uiController.inicializar();

        console.log('[PlayaAlertaApp] Aplicación lista.');
    }
}


/* =============================================================
   PUNTO DE ENTRADA
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const app = new PlayaAlertaApp();
    app.arrancar();
});
