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

        /* Mapa indexado por ID para búsqueda y eliminación directa de marcadores */
        this.marcadoresPorId = new Map();

        /* Callback para notificar cambios de estado (id_anonimo, nuevoEstado) */
        this.onStatusChange = null;
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
     * El popup incluye botones interactivos Y/N para actualizar el estado
     * directamente en el mapa (PATCH a la base de datos).
     *
     * @param {Object}   reporte          - Datos del reporte {id_anonimo, latitud, longitud, tipo, titulo, descripcion, estado}
     * @param {Function} [onStatusChange] - Callback(id, nuevoEstado) para persistir el cambio
     */
    agregarMarcadorConfirmado(reporte, onStatusChange) {
        const lat = parseFloat(reporte.latitud);
        const lng = parseFloat(reporte.longitud);

        if (isNaN(lat) || isNaN(lng)) return;

        const esTrafico = (reporte.tipo === 'trafico' || reporte.categoria === 'Tráfico');
        const colorBg   = esTrafico ? '#F59E0B' : '#EF4444'; /* amber-500 | red-500 */
        const iconoSvg  = esTrafico
            ? '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C9.24 2 7 4.24 7 7v10c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-5c-.83 0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11.5 12 11.5zm0-5c-.83 0-1.5-.67-1.5-1.5S11.17 4 12 4s1.5.67 1.5 1.5S12.83 6.5 12 6.5z"/></svg>'
            : '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';

        const customIcon = L.divIcon({
            className: 'report-confirmed-icon',
            html: `<div style="background-color:${colorBg}; width:100%; height:100%; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white;">${iconoSvg}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        /* Estado reactivo del reporte */
        const estadoActual = {
            valor: (reporte.estado === 'resuelto' || reporte.estado === 'N') ? 'resuelto' : 'activo'
        };

        let marker = null;

        /**
         * crearContenedorPopup()
         * Construye el nodo DOM del popup con la cabecera, título, descripción y
         * la sección de STATUS con botones interactivos Y (Activo) / N (Resuelto).
         */
        const crearContenedorPopup = () => {
            const contenedor = document.createElement('div');
            contenedor.style.cssText = 'font-family:system-ui, -apple-system, sans-serif; min-width:210px; max-width:260px; padding:4px;';

            const esActivo   = (estadoActual.valor === 'activo');
            const badgeBg    = esActivo ? '#dcfce7' : '#fee2e2';
            const badgeColor = esActivo ? '#15803d' : '#b91c1c';
            const labelBadge = esActivo ? 'ACTIVO' : 'RESUELTO';

            contenedor.innerHTML = `
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:#6b7280; font-weight:800; margin-bottom:6px; display:flex; align-items:center; justify-content:space-between; gap:6px;">
                    <span>${esTrafico ? 'Tráfico' : 'Incidencia'}</span>
                    <span style="background:${badgeBg}; color:${badgeColor}; padding:2px 8px; border-radius:999px; font-weight:800; font-size:10px;">
                        ${labelBadge}
                    </span>
                </div>
                <div style="font-weight:800; font-size:14px; color:#111827; line-height:1.25; margin-bottom:4px;">
                    ${reporte.titulo || 'Sin título'}
                </div>
                <div style="font-size:12px; color:#4b5563; line-height:1.4; margin-bottom:12px;">
                    ${reporte.descripcion || 'Sin descripción'}
                </div>

                <!-- ── Sección STATUS con botones Y / N ── -->
                <div style="border-top:1px solid #f3f4f6; padding-top:10px; display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <span style="font-size:10px; font-weight:900; color:#6b7280; text-transform:uppercase; letter-spacing:0.12em;">
                        STATUS
                    </span>
                    <div style="display:flex; align-items:center; justify-content:center; gap:12px; width:100%;">
                        <!-- Botón Y (Activo / Sí) -->
                        <button type="button" class="popup-btn-y" style="
                            flex:1; max-width:64px; height:34px; border-radius:12px; font-weight:800; font-size:13px;
                            border:2px solid ${esActivo ? '#16a34a' : '#e5e7eb'};
                            background:${esActivo ? '#16a34a' : '#f9fafb'};
                            color:${esActivo ? '#ffffff' : '#6b7280'};
                            cursor:pointer; transition:all 0.15s ease;
                            display:flex; align-items:center; justify-content:center;
                            box-shadow:${esActivo ? '0 3px 8px rgba(22,163,74,0.3)' : 'none'};
                        " title="Marcar como Activo (Y)">
                            Y
                        </button>
                        <!-- Botón N (Resuelto / No) -->
                        <button type="button" class="popup-btn-n" style="
                            flex:1; max-width:64px; height:34px; border-radius:12px; font-weight:800; font-size:13px;
                            border:2px solid ${!esActivo ? '#dc2626' : '#e5e7eb'};
                            background:${!esActivo ? '#dc2626' : '#f9fafb'};
                            color:${!esActivo ? '#ffffff' : '#6b7280'};
                            cursor:pointer; transition:all 0.15s ease;
                            display:flex; align-items:center; justify-content:center;
                            box-shadow:${!esActivo ? '0 3px 8px rgba(220,38,38,0.3)' : 'none'};
                        " title="Marcar como Resuelto (N)">
                            N
                        </button>
                    </div>
                </div>
            `;

            const btnY = contenedor.querySelector('.popup-btn-y');
            const btnN = contenedor.querySelector('.popup-btn-n');
            const cb   = onStatusChange || this.onStatusChange;

            const manejarCambioEstado = async (nuevoEstado) => {
                if (estadoActual.valor === nuevoEstado) return;

                btnY.disabled = true;
                btnN.disabled = true;
                btnY.style.opacity = '0.5';
                btnN.style.opacity = '0.5';

                try {
                    if (cb) {
                        await cb(reporte.id_anonimo, nuevoEstado);
                    }
                    estadoActual.valor = nuevoEstado;
                    reporte.estado     = nuevoEstado;

                    /* Ajusta opacidad del marcador: semi-transparente si está resuelto */
                    if (marker) {
                        marker.setOpacity(nuevoEstado === 'resuelto' ? 0.6 : 1.0);
                    }

                    /* Actualiza el contenido del popup en caliente */
                    popup.setContent(crearContenedorPopup());
                } catch (err) {
                    console.error('[MapController] Error al cambiar estado en popup:', err);
                    btnY.disabled = false;
                    btnN.disabled = false;
                    btnY.style.opacity = '1';
                    btnN.style.opacity = '1';
                }
            };

            btnY.addEventListener('click', (e) => {
                e.stopPropagation();
                manejarCambioEstado('activo');
            });

            btnN.addEventListener('click', (e) => {
                e.stopPropagation();
                manejarCambioEstado('resuelto');
            });

            return contenedor;
        };

        const popup = L.popup({ maxWidth: 280, minWidth: 210, autoPan: true })
            .setContent(crearContenedorPopup());

        marker = L.marker([lat, lng], {
            icon: customIcon,
            opacity: (estadoActual.valor === 'resuelto') ? 0.6 : 1.0
        }).bindPopup(popup);

        this.capaReportes.addLayer(marker);

        /* Guarda referencia en el mapa indexado por ID para manipulación o eliminación */
        if (reporte.id_anonimo) {
            this.marcadoresPorId.set(Number(reporte.id_anonimo), marker);
        }

        return marker;
    }

    /**
     * removerMarcador(id)
     * Remueve del mapa el marcador correspondiente al ID de reporte eliminado.
     *
     * @param {number|string} id - ID del reporte (id_anonimo)
     * @returns {boolean} - true si se encontró y eliminó el marcador
     */
    removerMarcador(id) {
        const idNum = Number(id);
        const marker = this.marcadoresPorId.get(idNum);
        if (marker) {
            this.capaReportes.removeLayer(marker);
            this.marcadoresPorId.delete(idNum);
            console.log(`[MapController] Marcador #${id} removido del mapa.`);
            return true;
        }
        return false;
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

        /* Elementos del modal de Administrador y Gestión de Reportes */
        this.userProfileModal         = document.getElementById('userProfileModal');
        this.perfilOverlay            = document.getElementById('perfilOverlay');
        this.adminCardContainer       = document.getElementById('adminCardContainer');
        this.viewAdminLogin           = document.getElementById('viewAdminLogin');
        this.viewAdminPanel           = document.getElementById('viewAdminPanel');
        this.formAdminLogin           = document.getElementById('formAdminLogin');
        this.inputAdminPassword       = document.getElementById('inputAdminPassword');
        this.adminLoginError          = document.getElementById('adminLoginError');
        this.btnAdminRecargar         = document.getElementById('btnAdminRecargar');
        this.btnAdminLogout           = document.getElementById('btnAdminLogout');
        this.adminReportesTbody       = document.getElementById('adminReportesTbody');
        this.inputAdminBuscar         = document.getElementById('inputAdminBuscar');
        this.adminConteoTotal         = document.getElementById('adminConteoTotal');
        this.adminConteoActivos       = document.getElementById('adminConteoActivos');
        this.adminConteoResueltos     = document.getElementById('adminConteoResueltos');

        /* Botones de cierre del modal admin */
        this.btnCerrarPerfil          = document.getElementById('btnCerrarPerfil');
        this.btnCerrarAdminPanel      = document.getElementById('btnCerrarAdminPanel');
        this.btnCerrarAdminSecundario = document.getElementById('btnCerrarAdminSecundario');
        this.btnCancelarLogin         = document.getElementById('btnCancelarLogin');

        /* Estado de autenticación del administrador */
        this._esAdmin                 = sessionStorage.getItem('playa_alerta_admin') === 'true';
        this._listaReportesAdmin      = [];

        /* Campos del formulario */
        this.reportForm         = document.getElementById('reportForm');
        this.inputTitulo        = document.getElementById('inputTitulo');
        this.inputDescripcion   = document.getElementById('inputDescripcion');
        this.inputAdjuntos      = document.getElementById('inputAdjuntos');
        this.adjuntosTexto      = document.getElementById('adjuntosTexto');
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
        this._registrarEventosAdmin();
        this._registrarEventoTrafico();
        this._registrarEventoIncidencia();
        this._registrarEventoClickMapa();
        this._registrarEventosModal();
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
     * Al hacer click en el avatar, despliega el acceso administrativo.
     */
    _registrarEventoUsuario() {
        if (!this.btnUsuario) return;

        this.btnUsuario.addEventListener('click', () => {
            console.log('[UIController] Botón de usuario/admin presionado.');
            this._abrirModalAdmin();
        });
    }

    /**
     * _registrarEventosAdmin() [privado]
     * Configura escuchadores para login con clave "VIALIDADES", búsqueda en vivo,
     * recarga y cierre del panel administrativo.
     */
    _registrarEventosAdmin() {
        /* Envío de formulario de contraseña */
        if (this.formAdminLogin) {
            this.formAdminLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                this._procesarLoginAdmin();
            });
        }

        /* Botón de recargar en tabla de administración */
        if (this.btnAdminRecargar) {
            this.btnAdminRecargar.addEventListener('click', () => {
                this._cargarTablaAdmin();
            });
        }

        /* Botón de cerrar sesión */
        if (this.btnAdminLogout) {
            this.btnAdminLogout.addEventListener('click', () => {
                this._logoutAdmin();
            });
        }

        /* Buscador en vivo de reportes */
        if (this.inputAdminBuscar) {
            this.inputAdminBuscar.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                this._filtrarReportesAdmin(query);
            });
        }

        /* Botones para cerrar el modal administrativo */
        const botonesCerrar = [
            this.btnCerrarPerfil,
            this.btnCerrarAdminPanel,
            this.btnCerrarAdminSecundario,
            this.btnCancelarLogin,
            this.perfilOverlay
        ];

        botonesCerrar.forEach((btn) => {
            if (btn) {
                btn.addEventListener('click', () => this._cerrarModalAdmin());
            }
        });

        /* Tecla Escape para salir del modal */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.userProfileModal && !this.userProfileModal.classList.contains('hidden')) {
                this._cerrarModalAdmin();
            }
        });
    }

    /**
     * _abrirModalAdmin() [privado]
     * Abre el modal y despliega la vista de Login (si no está autenticado)
     * o directamente el Panel de Administración (si ya ingresó "VIALIDADES").
     */
    _abrirModalAdmin() {
        if (!this.userProfileModal) return;

        this.userProfileModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            this.userProfileModal.classList.add('modal-visible');
        });

        if (this._esAdmin) {
            this._mostrarVistaAdminPanel();
            this._cargarTablaAdmin();
        } else {
            this._mostrarVistaLogin();
        }
    }

    /**
     * _mostrarVistaLogin() [privado]
     */
    _mostrarVistaLogin() {
        if (this.adminCardContainer) {
            this.adminCardContainer.classList.remove('max-w-4xl');
            this.adminCardContainer.classList.add('max-w-md');
        }
        if (this.viewAdminLogin) this.viewAdminLogin.classList.remove('hidden');
        if (this.viewAdminPanel) this.viewAdminPanel.classList.add('hidden');
        if (this.adminLoginError) this.adminLoginError.classList.add('hidden');
        if (this.inputAdminPassword) {
            this.inputAdminPassword.value = '';
            setTimeout(() => this.inputAdminPassword.focus(), 120);
        }
    }

    /**
     * _mostrarVistaAdminPanel() [privado]
     */
    _mostrarVistaAdminPanel() {
        if (this.adminCardContainer) {
            this.adminCardContainer.classList.remove('max-w-md');
            this.adminCardContainer.classList.add('max-w-4xl');
        }
        if (this.viewAdminLogin) this.viewAdminLogin.classList.add('hidden');
        if (this.viewAdminPanel) this.viewAdminPanel.classList.remove('hidden');
        if (this.inputAdminBuscar) this.inputAdminBuscar.value = '';
    }

    /**
     * _cerrarModalAdmin() [privado]
     */
    _cerrarModalAdmin() {
        if (!this.userProfileModal) return;

        this.userProfileModal.classList.remove('modal-visible');
        setTimeout(() => {
            this.userProfileModal.classList.add('hidden');
        }, 200);

        console.log('[UIController] Modal administrativo cerrado.');
    }

    /**
     * _procesarLoginAdmin() [privado]
     * Valida la contraseña 'VIALIDADES' (insensible a mayúsculas/minúsculas).
     */
    _procesarLoginAdmin() {
        if (!this.inputAdminPassword) return;

        const clave = this.inputAdminPassword.value.trim().toUpperCase();
        const claveAutorizada = 'VIALIDADES';

        if (clave === claveAutorizada) {
            this._esAdmin = true;
            sessionStorage.setItem('playa_alerta_admin', 'true');

            if (this.adminLoginError) this.adminLoginError.classList.add('hidden');
            this.inputAdminPassword.value = '';

            this._mostrarVistaAdminPanel();
            this._cargarTablaAdmin();
            this._mostrarFeedback('¡Acceso concedido al Panel de Administración!', 'exito');
        } else {
            if (this.adminLoginError) {
                this.adminLoginError.classList.remove('hidden');
            }
            this.inputAdminPassword.focus();
            this.inputAdminPassword.select();
        }
    }

    /**
     * _logoutAdmin() [privado]
     * Cierra la sesión de administrador.
     */
    _logoutAdmin() {
        this._esAdmin = false;
        sessionStorage.removeItem('playa_alerta_admin');
        this._mostrarVistaLogin();
        this._mostrarFeedback('Sesión de administración finalizada.', 'info');
    }

    /**
     * _cargarTablaAdmin() [privado]
     * Consulta GET /api/reportes para poblar la tabla con todos los registros.
     */
    async _cargarTablaAdmin() {
        if (!this.adminReportesTbody) return;

        this.adminReportesTbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-12 text-center text-gray-400">
                    <div class="flex flex-col items-center justify-center gap-2">
                        <svg class="w-6 h-6 animate-spin text-[#003366]" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span class="text-xs font-semibold text-gray-500">Consultando reportes en la base de datos...</span>
                    </div>
                </td>
            </tr>
        `;

        try {
            const res = await fetch('/api/reportes');
            const data = await res.json();

            if (!data.ok || !Array.isArray(data.reportes)) {
                throw new Error(data.mensaje || 'Error en respuesta de base de datos');
            }

            this._listaReportesAdmin = data.reportes;
            this._actualizarConteosAdmin(this._listaReportesAdmin);
            this._renderizarTablaAdmin(this._listaReportesAdmin);

        } catch (error) {
            console.error('[UIController] Error al cargar reportes:', error);
            this.adminReportesTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-8 text-center text-red-500 text-xs font-bold">
                        Error al cargar reportes: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    /**
     * _actualizarConteosAdmin(reportes) [privado]
     */
    _actualizarConteosAdmin(reportes) {
        const total = reportes.length;
        const activos = reportes.filter(r => r.estado === 'activo' || r.estado === 'Y').length;
        const resueltos = total - activos;

        if (this.adminConteoTotal) {
            this.adminConteoTotal.textContent = `${total} ${total === 1 ? 'reporte' : 'reportes'}`;
        }
        if (this.adminConteoActivos) {
            this.adminConteoActivos.textContent = `${activos} activos`;
        }
        if (this.adminConteoResueltos) {
            this.adminConteoResueltos.textContent = `${resueltos} resueltos`;
        }
    }

    /**
     * _filtrarReportesAdmin(query) [privado]
     */
    _filtrarReportesAdmin(query) {
        if (!query) {
            this._renderizarTablaAdmin(this._listaReportesAdmin);
            return;
        }

        const filtrados = this._listaReportesAdmin.filter((rep) => {
            const id = String(rep.id_anonimo || '');
            const tit = String(rep.titulo || '').toLowerCase();
            const desc = String(rep.descripcion || '').toLowerCase();
            const cat = String(rep.categoria || '').toLowerCase();
            const est = String(rep.estado || '').toLowerCase();

            return id.includes(query) ||
                   tit.includes(query) ||
                   desc.includes(query) ||
                   cat.includes(query) ||
                   est.includes(query);
        });

        this._renderizarTablaAdmin(filtrados);
    }

    /**
     * _renderizarTablaAdmin(reportes) [privado]
     * Construye cada fila de la tabla con datos, botones de cambio de estado y eliminación.
     */
    _renderizarTablaAdmin(reportes) {
        if (!this.adminReportesTbody) return;

        if (!reportes || reportes.length === 0) {
            this.adminReportesTbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-12 text-center text-gray-400">
                        <div class="flex flex-col items-center justify-center gap-2">
                            <svg class="w-8 h-8 opacity-40 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <span class="text-xs font-bold text-gray-600">No se encontraron reportes</span>
                            <span class="text-[11px] text-gray-400">Aún no hay reportes registrados o ninguno coincide con la búsqueda.</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.adminReportesTbody.innerHTML = '';

        reportes.forEach((rep) => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50/80 transition-colors group';

            const esTrafico = (rep.categoria === 'Tráfico' || rep.tipo === 'trafico');
            const esActivo  = (rep.estado === 'activo' || rep.estado === 'Y');

            const lat = Number(rep.latitud).toFixed(4);
            const lng = Number(rep.longitud).toFixed(4);

            tr.innerHTML = `
                <td class="py-2.5 px-2.5 font-mono text-[11px] font-bold text-gray-400">
                    #${rep.id_anonimo}
                </td>
                <td class="py-2.5 px-2.5">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${esTrafico ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}">
                        ${esTrafico ? 'Tráfico' : 'Incidencia'}
                    </span>
                </td>
                <td class="py-2.5 px-2.5 max-w-xs">
                    <div class="font-bold text-gray-900 text-xs truncate" title="${rep.titulo || 'Sin título'}">
                        ${rep.titulo || 'Sin título'}
                    </div>
                    <div class="text-[11px] text-gray-500 line-clamp-1 mt-0.5" title="${rep.descripcion || ''}">
                        ${rep.descripcion || 'Sin descripción'}
                    </div>
                </td>
                <td class="py-2.5 px-2.5 whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                        <span class="font-mono text-[10px] text-gray-500">${lat}, ${lng}</span>
                        <button type="button"
                                class="btn-ver-admin p-1 text-[#003366] bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                title="Centrar mapa en este reporte">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                        </button>
                    </div>
                </td>
                <td class="py-2.5 px-2.5 text-center">
                    <button type="button"
                            class="btn-toggle-estado-admin px-2 py-0.5 rounded-full text-[10px] font-black uppercase transition-all ${esActivo ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
                            title="Haz clic para alternar estado">
                        ${esActivo ? 'Activo' : 'Resuelto'}
                    </button>
                </td>
                <td class="py-2.5 px-2.5 text-right whitespace-nowrap">
                    <button type="button"
                            class="btn-eliminar-admin inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all shadow-sm focus:outline-none"
                            title="Eliminar reporte de la base de datos">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Eliminar
                    </button>
                </td>
            `;

            /* Listener: Centrar en mapa */
            const btnVer = tr.querySelector('.btn-ver-admin');
            if (btnVer) {
                btnVer.addEventListener('click', () => {
                    this._cerrarModalAdmin();
                    this._centrarEnReporte(parseFloat(rep.latitud), parseFloat(rep.longitud));
                });
            }

            /* Listener: Cambiar estado Activo / Resuelto */
            const btnToggle = tr.querySelector('.btn-toggle-estado-admin');
            if (btnToggle) {
                btnToggle.addEventListener('click', async () => {
                    const estadoActual = (rep.estado === 'activo' || rep.estado === 'Y') ? 'activo' : 'resuelto';
                    const nuevoEstado = (estadoActual === 'activo') ? 'resuelto' : 'activo';

                    btnToggle.disabled = true;
                    btnToggle.style.opacity = '0.5';

                    try {
                        await this.actualizarEstadoReporte(rep.id_anonimo, nuevoEstado);
                        rep.estado = nuevoEstado;

                        if (this.mapController && this.mapController.marcadoresPorId) {
                            const marker = this.mapController.marcadoresPorId.get(Number(rep.id_anonimo));
                            if (marker) {
                                marker.setOpacity(nuevoEstado === 'resuelto' ? 0.6 : 1.0);
                            }
                        }

                        this._renderizarTablaAdmin(this._listaReportesAdmin);
                        this._actualizarConteosAdmin(this._listaReportesAdmin);
                    } catch (err) {
                        btnToggle.disabled = false;
                        btnToggle.style.opacity = '1';
                    }
                });
            }

            /* Listener: Eliminar reporte con confirmación */
            const btnEliminar = tr.querySelector('.btn-eliminar-admin');
            if (btnEliminar) {
                btnEliminar.addEventListener('click', async () => {
                    const titulo = rep.titulo || 'Sin título';
                    const confirmar = confirm(`¿Estás seguro de eliminar permanentemente el reporte #${rep.id_anonimo} ("${titulo}")?\n\nEsta acción borrará el registro de la base de datos.`);
                    if (!confirmar) return;

                    btnEliminar.disabled = true;
                    btnEliminar.innerHTML = `
                        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Borrando…
                    `;

                    try {
                        const res = await fetch(`/api/reportes/${rep.id_anonimo}`, {
                            method: 'DELETE',
                            headers: {
                                'x-admin-password': 'VIALIDADES'
                            }
                        });

                        const data = await res.json();
                        if (!res.ok || !data.ok) {
                            throw new Error(data.mensaje || `HTTP ${res.status}`);
                        }

                        /* Remover de la lista local */
                        this._listaReportesAdmin = this._listaReportesAdmin.filter(r => r.id_anonimo !== rep.id_anonimo);

                        /* Remover el marcador del mapa Leaflet */
                        if (this.mapController) {
                            this.mapController.removerMarcador(rep.id_anonimo);
                        }

                        /* Re-renderizar tabla y contadores */
                        this._renderizarTablaAdmin(this._listaReportesAdmin);
                        this._actualizarConteosAdmin(this._listaReportesAdmin);

                        this._mostrarFeedback(`Reporte #${rep.id_anonimo} eliminado con éxito`, 'exito');

                    } catch (err) {
                        console.error('[UIController] Error al eliminar:', err);
                        this._mostrarFeedback(`Error al eliminar: ${err.message}`, 'error');
                        btnEliminar.disabled = false;
                        btnEliminar.innerHTML = `Eliminar`;
                    }
                });
            }

            this.adminReportesTbody.appendChild(tr);
        });
    }

    /**
     * _centrarEnReporte(lat, lng) [privado]
     * Cierra el modal de administración y vuela el mapa suavemente al punto del reporte.
     */
    _centrarEnReporte(lat, lng) {
        if (isNaN(lat) || isNaN(lng)) return;
        this._cerrarModalAdmin();
        this.mapa.flyTo([lat, lng], 16, {
            animate: true,
            duration: 1.2
        });
    }

    /**
     * _registrarEventoTrafico() [privado]
     * Botón de reporte rápido de Tráfico: utiliza GPS para ubicar a la persona.
     */
    _registrarEventoTrafico() {
        if (!this.btnTrafico) return;

        this.btnTrafico.addEventListener('click', () => {
            this._iniciarReporteRapido('trafico');
        });
    }

    /**
     * _registrarEventoIncidencia() [privado]
     * Botón de reporte rápido de Incidencias: utiliza GPS para ubicar a la persona.
     */
    _registrarEventoIncidencia() {
        if (!this.btnIncidencia) return;

        this.btnIncidencia.addEventListener('click', () => {
            this._iniciarReporteRapido('incidencia');
        });
    }

    /**
     * _registrarEventosTabsTipo() [privado]
     * Permite cambiar la categoría del reporte desde las pestañas del modal.
     */
    _registrarEventosTabsTipo() {
        if (this.tabTipoIncidencia) {
            this.tabTipoIncidencia.addEventListener('click', () => {
                this._cambiarTipo('incidencia');
            });
        }

        if (this.tabTipoTrafico) {
            this.tabTipoTrafico.addEventListener('click', () => {
                this._cambiarTipo('trafico');
            });
        }
    }

    /**
     * _iniciarReporteRapido(tipo) [privado]
     * Obtiene la ubicación GPS actual del usuario mediante navigator.geolocation,
     * coloca el MAP POINT animado en dicha posición, centra el mapa y abre el modal.
     * Si el permiso es denegado o falla, recurre de forma segura al centro del mapa.
     *
     * @param {'trafico'|'incidencia'} tipo
     */
    _iniciarReporteRapido(tipo) {
        const btn = (tipo === 'trafico') ? this.btnTrafico : this.btnIncidencia;
        const contenidoOriginal = btn ? btn.innerHTML : '';

        /* Comprobación de soporte de Geolocation API */
        if (!navigator.geolocation) {
            console.warn('[UIController] Geolocalización no soportada en este navegador.');
            this._mostrarFeedback('Geolocalización no soportada. Usando centro del mapa.', 'error');
            const centro = this.mapa.getCenter();
            if (this.mapController) {
                this.mapController.colocarPunto(centro);
            }
            this._abrirModal(tipo, centro);
            return;
        }

        /* Estado visual de carga en el botón pulsado */
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.75';
            btn.innerHTML = `
                <svg class="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
            `;
        }

        this._mostrarFeedback('Obteniendo tu ubicación actual por GPS...', 'info');

        const restaurarBoton = () => {
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.innerHTML = contenidoOriginal;
            }
        };

        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                restaurarBoton();
                const lat = posicion.coords.latitude;
                const lng = posicion.coords.longitude;
                const latlng = L.latLng(lat, lng);

                console.log(`[UIController] Geolocalización GPS obtenida → Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);

                /* Centra y traslada el mapa a las coordenadas reales */
                this.mapa.flyTo(latlng, 16, { animate: true, duration: 1.0 });

                /* Ubica el marcador animado MAP POINT en la ubicación de la persona */
                if (this.mapController) {
                    this.mapController.colocarPunto(latlng);
                }

                /* Abre el formulario de reporte con las coordenadas de la persona */
                this._abrirModal(tipo, latlng);
            },
            (error) => {
                restaurarBoton();
                console.warn('[UIController] Error o rechazo de GPS:', error.message);

                let mensaje = 'No se pudo obtener tu ubicación actual. Usando centro del mapa.';
                if (error.code === error.PERMISSION_DENIED) {
                    mensaje = 'Permiso de ubicación denegado. Usando centro del mapa.';
                } else if (error.code === error.TIMEOUT) {
                    mensaje = 'Tiempo de espera agotado al consultar GPS. Usando centro del mapa.';
                }

                this._mostrarFeedback(mensaje, 'error');

                const centro = this.mapa.getCenter();
                if (this.mapController) {
                    this.mapController.colocarPunto(centro);
                }
                this._abrirModal(tipo, centro);
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 10000
            }
        );
    }

    /**
     * actualizarEstadoReporte(id, nuevoEstado)
     * Persiste la actualización de estado (activo/resuelto) en el backend (PATCH /api/reportes/:id/estado)
     * cuando el usuario pulsa Y / N en el popup del marcador en el mapa.
     *
     * @param {number|string} id - ID del reporte (id_anonimo)
     * @param {'activo'|'resuelto'} nuevoEstado
     * @returns {Promise<boolean>}
     */
    async actualizarEstadoReporte(id, nuevoEstado) {
        if (!id) {
            console.warn('[UIController] No se puede actualizar reporte sin ID.');
            return false;
        }

        try {
            const res = await fetch(`/api/reportes/${id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || `HTTP ${res.status}`);
            }

            const labelEstado = (nuevoEstado === 'activo') ? 'Activo' : 'Resuelto';
            this._mostrarFeedback(`Reporte #${id} marcado como "${labelEstado}"`, 'exito');
            console.log(`[UIController] Estado de reporte #${id} actualizado en BD a: ${nuevoEstado}`);
            return true;
        } catch (error) {
            console.error('[UIController] Error al actualizar estado del reporte:', error.message);
            this._mostrarFeedback(`Error al actualizar estado: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * _cambiarTipo(tipo) [privado]
     * Actualiza la categoría seleccionada y el estilo correspondiente del formulario.
     *
     * @param {'trafico'|'incidencia'} tipo
     */
    _cambiarTipo(tipo) {
        const configuracion = this.tiposReporte[tipo];
        if (!configuracion) return;

        this._tipoActivo = tipo;
        this.modalTitle.textContent = configuracion.label;
        this.modalHeader.style.backgroundColor = configuracion.color;
        this.modalIcon.style.backgroundColor = configuracion.colorBtn;
        this.modalIcon.innerHTML = `
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="${configuracion.svgPath}"></path>
            </svg>
        `;
        this.btnEnviarReporte.style.backgroundColor = configuracion.colorBtn;

        for (const input of [this.inputTitulo, this.inputDescripcion]) {
            input.classList.remove('focus:ring-amber-400', 'focus:ring-red-400');
            input.classList.add(configuracion.ring);
        }

        const clasesActivas = tipo === 'trafico'
            ? ['bg-amber-50', 'text-amber-700', 'border-amber-300']
            : ['bg-red-50', 'text-red-700', 'border-red-300'];
        const clasesInactivas = ['bg-gray-100', 'text-gray-500', 'border-gray-200'];
        const otrasClasesActivas = tipo === 'trafico'
            ? ['bg-red-50', 'text-red-700', 'border-red-300']
            : ['bg-amber-50', 'text-amber-700', 'border-amber-300'];
        const tabActivo = tipo === 'trafico' ? this.tabTipoTrafico : this.tabTipoIncidencia;
        const tabInactivo = tipo === 'trafico' ? this.tabTipoIncidencia : this.tabTipoTrafico;

        if (tabActivo && tabInactivo) {
            tabActivo.classList.remove(...clasesInactivas, ...otrasClasesActivas);
            tabActivo.classList.add(...clasesActivas);
            tabInactivo.classList.remove(...clasesActivas, ...otrasClasesActivas);
            tabInactivo.classList.add(...clasesInactivas);
        }
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
     * Guarda el reporte en la base de datos a través de POST /api/reportes.
     * Por defecto, todo nuevo reporte nace con estado "activo".
     */
    async _enviarReporte() {
        const coords = this._coordenadasActivas || this.mapa.getCenter();

        const payload = {
            tipo:        this._tipoActivo,
            titulo:      this.inputTitulo.value.trim(),
            descripcion: this.inputDescripcion.value.trim(),
            latitud:     coords.lat.toFixed(6),
            longitud:    coords.lng.toFixed(6),
            estado:      'activo' /* El status se administra posteriormente en el mapa */
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

            console.log(`[UIController] Reporte guardado en Base de Datos (Supabase) → ID: ${datos.id}`);
            this._reporteGuardadoExito = true;

            /* Remueve el MAP POINT temporal y agrega el marcador definitivo con interactividad de estado */
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
     * Notificación toast flotante con soporte para estados de éxito, info y error.
     */
    _mostrarFeedback(mensaje, tipo) {
        const anterior = document.getElementById('toastFeedback');
        if (anterior) anterior.remove();

        const color = (tipo === 'exito') ? '#16a34a' : (tipo === 'info') ? '#003366' : '#dc2626';

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

        /* 3. Conecta el callback para actualizar estado en BD desde los popups del mapa */
        this.mapController.onStatusChange = (id, nuevoEstado) => {
            return this.uiController.actualizarEstadoReporte(id, nuevoEstado);
        };

        /* 4. Registra eventos de UI y clicks del mapa */
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
