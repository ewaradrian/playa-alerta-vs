/**
 * =============================================================
 * ARCHIVO: map.js
 * PROYECTO: Playa Alerta
 * DESCRIPCIÓN: Módulo principal de la aplicación. Implementa
 *              una arquitectura orientada a objetos (OOP) con
 *              tres clases bien definidas:
 *
 *   ┌─────────────────────────────────────────┐
 *   │  MapController   → gestiona el mapa     │
 *   │  UIController    → gestiona la interfaz │
 *   │  PlayaAlertaApp  → orquesta la app      │
 *   └─────────────────────────────────────────┘
 *
 * DEPENDENCIAS: Leaflet.js (debe cargarse antes que este script)
 * AUTOR: Equipo Playa Alerta
 * ÚLTIMA ACTUALIZACIÓN: 2026-11-02
 * =============================================================
 */


/* =============================================================
   CLASE 1 — MapController
   Responsabilidad única: todo lo relacionado con el mapa
   interactivo (Leaflet). Encapsula la configuración geográfica,
   la inicialización del mapa y la capa de teselas (tiles).
   ============================================================= */

class MapController {

    /**
     * Constructor — define la configuración inicial del mapa.
     * Se ejecuta automáticamente al hacer "new MapController()".
     *
     * @param {string} elementId - ID del elemento HTML que contendrá el mapa.
     */
    constructor(elementId) {

        /* ID del elemento <main> donde Leaflet renderizará el mapa */
        this.elementId = elementId;

        /* Coordenadas [latitud, longitud] del centro de Playa del Carmen */
        this.centroPlaya = [20.6296, -87.0739];

        /* Nivel de zoom inicial al cargar la página */
        this.zoomInicial = 14;

        /* Límites de zoom: el usuario no puede alejarse ni acercarse más de estos valores */
        this.minZoom = 12;
        this.maxZoom = 18;

        /**
         * Límites geográficos del mapa (bounding box de Quintana Roo).
         * El usuario no podrá arrastrar el mapa fuera de esta área.
         * Formato: L.latLngBounds([sur-oeste], [norte-este])
         */
        this.limiteGeografico = L.latLngBounds(
            [20.3000, -87.4000], /* Esquina sur-oeste */
            [20.8000, -86.8000]  /* Esquina norte-este */
        );

        /* URL de la capa de teselas (OpenStreetMap) con marcadores de posición {s}, {z}, {x}, {y} */
        this.urlTeselas = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        /* Texto de atribución requerido por la licencia de OpenStreetMap */
        this.atribucion = '&copy; OpenStreetMap contributors — Playa Alerta';

        /* Referencia al objeto de mapa de Leaflet (se asigna en inicializar()) */
        this.mapa = null;
    }

    /**
     * inicializar()
     * Crea e instancia el mapa de Leaflet en el DOM con toda
     * la configuración definida en el constructor.
     *
     * @returns {L.Map} - La instancia del mapa para encadenamiento.
     */
    inicializar() {

        /* Crea el mapa en el elemento HTML indicado por this.elementId */
        this.mapa = L.map(this.elementId, {
            center:             this.centroPlaya,       /* Centro inicial del mapa */
            zoom:               this.zoomInicial,       /* Zoom inicial */
            minZoom:            this.minZoom,           /* Zoom mínimo permitido */
            maxZoom:            this.maxZoom,           /* Zoom máximo permitido */
            maxBounds:          this.limiteGeografico,  /* Área geográfica permitida */
            maxBoundsViscosity: 1.0,                    /* 1.0 = el mapa rebota sin salirse del área */
            zoomControl:        false                   /* Desactiva el zoom nativo (lo añadimos manualmente) */
        });

        /* Añade el control de zoom en la esquina inferior derecha */
        L.control.zoom({ position: 'bottomright' }).addTo(this.mapa);

        /* Añade la capa de teselas (el mapa visual de OpenStreetMap) */
        this._agregarCapaTeselas();

        console.log('[MapController] Mapa inicializado correctamente.');

        /* Retorna la instancia del mapa por si se necesita encadenar métodos */
        return this.mapa;
    }

    /**
     * _agregarCapaTeselas()  [método privado — prefijo _ por convención]
     * Descarga y renderiza los tiles (cuadros) del mapa base.
     * updateWhenIdle y keepBuffer mejoran el rendimiento en conexiones lentas.
     */
    _agregarCapaTeselas() {
        L.tileLayer(this.urlTeselas, {
            attribution:    this.atribucion,
            updateWhenIdle: true, /* Actualiza tiles solo cuando el mapa deja de moverse */
            keepBuffer:     2     /* Guarda en caché 2 tiles extra alrededor de la vista actual */
        }).addTo(this.mapa);
    }

    /**
     * getMapa()
     * Devuelve la instancia del mapa de Leaflet.
     * Útil para que otros módulos interactúen con el mapa
     * sin acceder directamente a la propiedad interna.
     *
     * @returns {L.Map} - Instancia de Leaflet.
     */
    getMapa() {
        return this.mapa;
    }
}


/* =============================================================
   CLASE 2 — UIController
   Responsabilidad única: gestionar toda la lógica de interfaz
   de usuario (botones, paneles, eventos del DOM).
   No conoce ni manipula el mapa directamente.
   ============================================================= */

class UIController {

    /**
     * Constructor — recibe la instancia del mapa para poder
     * disparar acciones cartográficas desde la UI si es necesario.
     *
     * @param {L.Map} mapa - Instancia del mapa de Leaflet.
     */
    constructor(mapa) {

        /* Guarda la referencia al mapa (puede usarse para centrar, añadir marcadores, etc.) */
        this.mapa = mapa;

        /* Referencias cacheadas a los elementos del DOM — botones principales */
        this.btnUsuario    = document.getElementById('btnUsuario');
        this.btnTrafico    = document.getElementById('btnTrafico');
        this.btnIncidencia = document.getElementById('btnIncidencia');

        /* Referencias al modal de registro de reporte */
        this.reportModal     = document.getElementById('reportModal');
        this.modalOverlay    = document.getElementById('modalOverlay');
        this.btnCerrarModal  = document.getElementById('btnCerrarModal');
        this.modalHeader     = document.getElementById('modalHeader');
        this.modalIcon       = document.getElementById('modalIcon');
        this.modalTitle      = document.getElementById('modalTitle');
        this.reportForm      = document.getElementById('reportForm');
        this.inputTitulo     = document.getElementById('inputTitulo');
        this.inputDescripcion= document.getElementById('inputDescripcion');
        this.inputAdjuntos   = document.getElementById('inputAdjuntos');
        this.adjuntosTexto   = document.getElementById('adjuntosTexto');
        this.btnEnviarReporte= document.getElementById('btnEnviarReporte');

        /**
         * Configuración visual de cada tipo de reporte.
         * Permite escalar fácilmente añadiendo más tipos sin tocar
         * la lógica del modal.
         */
        this.tiposReporte = {
            trafico: {
                label:    'Tráfico',
                color:    '#D97706',          /* amber-600  */
                colorBtn: '#F59E0B',          /* amber-400  */
                ring:     'focus:ring-amber-400',
                svgPath:  /* semáforo */
                    'M12 2C9.24 2 7 4.24 7 7v10c0 2.76 2.24 5 5 5s5-2.24 ' +
                    '5-5V7c0-2.76-2.24-5-5-5zm0 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 ' +
                    '1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-5c-.83 ' +
                    '0-1.5-.67-1.5-1.5S11.17 8 12 8s1.5.67 1.5 1.5S12.83 11.5 12 ' +
                    '11.5zm0-5c-.83 0-1.5-.67-1.5-1.5S11.17 4 12 4s1.5.67 1.5 1.5S12.83 6.5 12 6.5z'
            },
            incidencia: {
                label:    'Incidencia Vial',
                color:    '#DC2626',          /* red-600    */
                colorBtn: '#EF4444',          /* red-500    */
                ring:     'focus:ring-red-400',
                svgPath:  /* triángulo alerta */
                    'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'
            }
        };

        /* Tipo de reporte activo (se asigna al abrir el modal) */
        this._tipoActivo = null;
    }

    /**
     * inicializar()
     * Registra todos los listeners de eventos de la interfaz.
     * Debe llamarse después de que el DOM esté completamente cargado.
     */
    inicializar() {
        this._registrarEventoUsuario();
        this._registrarEventoTrafico();
        this._registrarEventoIncidencia();
        this._registrarEventosModal();

        console.log('[UIController] Eventos de interfaz registrados.');
    }

    /**
     * _registrarEventoUsuario()  [privado]
     * Configura el comportamiento del botón de perfil de usuario
     * en la esquina superior derecha.
     */
    _registrarEventoUsuario() {
        if (!this.btnUsuario) return; /* Guarda defensiva: sale si el elemento no existe */

        this.btnUsuario.addEventListener('click', () => {
            /* TODO: Abrir panel de perfil / login del usuario */
            console.log('[UIController] Botón de usuario presionado.');
            alert('Perfil de usuario — próximamente disponible.');
        });
    }

    /**
     * _registrarEventoTrafico()  [privado]
     * Configura el botón de reporte de tráfico.
     * Al hacer click, abre el modal con el tipo "trafico".
     */
    _registrarEventoTrafico() {
        if (!this.btnTrafico) return;

        this.btnTrafico.addEventListener('click', () => {
            /* Abre el modal de registro preconfigurado para tráfico */
            this._abrirModal('trafico');
        });
    }

    /**
     * _registrarEventoIncidencia()  [privado]
     * Configura el botón de reporte de incidencias viales.
     * Al hacer click, abre el modal con el tipo "incidencia".
     */
    _registrarEventoIncidencia() {
        if (!this.btnIncidencia) return;

        this.btnIncidencia.addEventListener('click', () => {
            this._abrirModal('incidencia');
        });
    }

    /**
     * _registrarEventosModal()  [privado]
     * Registra todos los eventos internos del modal:
     *   - Cerrar al hacer click en la X
     *   - Cerrar al hacer click en el overlay
     *   - Cerrar con la tecla Escape
     *   - Previsualizar archivos adjuntos seleccionados
     *   - Enviar el formulario
     */
    _registrarEventosModal() {

        /* Cerrar modal con el botón ✕ */
        this.btnCerrarModal.addEventListener('click', () => this._cerrarModal());

        /* Cerrar modal haciendo click fuera de la tarjeta (en el overlay) */
        this.modalOverlay.addEventListener('click', () => this._cerrarModal());

        /* Cerrar modal con la tecla Escape */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.reportModal.classList.contains('hidden')) {
                this._cerrarModal();
            }
        });

        /* Actualizar texto del área de adjuntos cuando el usuario elige archivos */
        this.inputAdjuntos.addEventListener('change', () => {
            const n = this.inputAdjuntos.files.length;
            this.adjuntosTexto.textContent =
                n === 0 ? 'Toca para adjuntar foto o video'
              : n === 1 ? `1 archivo seleccionado`
              :           `${n} archivos seleccionados`;
        });

        /* Manejar envío del formulario */
        this.reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this._enviarReporte();
        });
    }

    /**
     * _abrirModal(tipo)  [privado]
     * Personaliza el modal según el tipo de reporte y lo hace visible.
     *
     * @param {string} tipo - 'trafico' | 'incidencia'
     */
    _abrirModal(tipo) {
        const cfg = this.tiposReporte[tipo];
        if (!cfg) return;

        this._tipoActivo = tipo;

        /* ── Personaliza la cabecera con el color del tipo ── */
        this.modalHeader.style.backgroundColor = cfg.color;
        this.modalTitle.textContent = cfg.label;

        /* ── Pinta el ícono SVG dentro del círculo blanco ── */
        this.modalIcon.style.backgroundColor = 'rgba(255,255,255,0.25)';
        this.modalIcon.innerHTML = `
            <svg class="w-6 h-6 text-white" fill="currentColor"
                 viewBox="0 0 24 24" aria-hidden="true">
                <path d="${cfg.svgPath}"/>
            </svg>`;

        /* ── Actualiza el color del anillo de focus y del botón de envío ── */
        this.inputTitulo.className = this.inputTitulo.className
            .replace(/focus:ring-\S+/g, '') + ` ${cfg.ring}`;
        this.inputDescripcion.className = this.inputDescripcion.className
            .replace(/focus:ring-\S+/g, '') + ` ${cfg.ring}`;
        this.btnEnviarReporte.style.backgroundColor = cfg.colorBtn;

        /* ── Limpia campos del formulario ── */
        this.reportForm.reset();
        this.adjuntosTexto.textContent = 'Toca para adjuntar foto o video';

        /* ── Muestra el modal con animación ── */
        this.reportModal.classList.remove('hidden');
        /* Espera un frame para que la transición CSS tenga efecto */
        requestAnimationFrame(() => {
            this.reportModal.classList.add('modal-visible');
        });

        /* Foco accesible: mueve el foco al campo de título */
        setTimeout(() => this.inputTitulo.focus(), 80);

        console.log(`[UIController] Modal abierto — tipo: ${tipo}`);
    }

    /**
     * _cerrarModal()  [privado]
     * Oculta el modal y resetea su estado.
     */
    _cerrarModal() {
        this.reportModal.classList.remove('modal-visible');
        /* Espera la transición de salida antes de ocultarlo del DOM */
        setTimeout(() => {
            this.reportModal.classList.add('hidden');
            this._tipoActivo = null;
        }, 200);

        console.log('[UIController] Modal cerrado.');
    }

    /**
     * _enviarReporte()  [privado]
     * Recopila los datos del formulario, los combina con la posición
     * del mapa y los registra. Cierra el modal al finalizar.
     *
     * TODO: Sustituir el console.log por una llamada real al backend (fetch/API).
     */
    _enviarReporte() {
        /* Obtiene el centro actual del mapa como objeto {lat, lng} */
        const centro = this.mapa.getCenter();

        /* Construye el objeto de reporte con todos los campos */
        const reporte = {
            tipo:        this._tipoActivo,
            titulo:      this.inputTitulo.value.trim(),
            descripcion: this.inputDescripcion.value.trim(),
            adjuntos:    this.inputAdjuntos.files.length,
            latitud:     centro.lat.toFixed(6),
            longitud:    centro.lng.toFixed(6),
            timestamp:   new Date().toISOString() /* ISO 8601 */
        };

        /* TODO: Enviar `reporte` al backend en lugar de solo registrarlo */
        console.log('[UIController] Reporte enviado:', reporte);

        /* Cierra el modal y limpia el formulario */
        this._cerrarModal();
    }
}


/* =============================================================
   CLASE 3 — PlayaAlertaApp
   Responsabilidad única: orquestar el arranque de la aplicación.
   Es el punto de entrada principal (equivalente al "main" en
   lenguajes como Java o C++).
   Crea, conecta y arranca todos los controladores.
   ============================================================= */

class PlayaAlertaApp {

    /**
     * Constructor — instancia los controladores pero NO los inicializa aún.
     * La inicialización real ocurre en arrancar() para tener control
     * total sobre el orden de ejecución.
     */
    constructor() {
        /* 1. Crea el controlador del mapa — aún no renderiza nada */
        this.mapController = new MapController('map');

        /* 2. El UIController se creará en arrancar() cuando el mapa esté listo */
        this.uiController = null;
    }

    /**
     * arrancar()
     * Método público que inicia la aplicación en el orden correcto:
     *   1. Inicializa el mapa (Leaflet)
     *   2. Usa el mapa para crear el controlador de UI
     *   3. Inicializa los eventos de la interfaz
     */
    arrancar() {
        console.log('[PlayaAlertaApp] Iniciando Playa Alerta...');

        /* PASO 1 — Inicializa el mapa y obtiene la instancia de Leaflet */
        const mapaLeaflet = this.mapController.inicializar();

        /* PASO 2 — Crea el controlador de UI pasándole la instancia del mapa */
        this.uiController = new UIController(mapaLeaflet);

        /* PASO 3 — Registra todos los eventos de la interfaz de usuario */
        this.uiController.inicializar();

        console.log('[PlayaAlertaApp] Aplicación lista.');
    }
}


/* =============================================================
   PUNTO DE ENTRADA
   Espera a que el DOM esté completamente cargado antes de
   instanciar y arrancar la aplicación. Esto garantiza que
   todos los elementos HTML (botones, el <main id="map">, etc.)
   existen antes de que el código JS intente acceder a ellos.
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* Crea la única instancia de la aplicación (patrón Singleton implícito) */
    const app = new PlayaAlertaApp();

    /* Arranca la aplicación */
    app.arrancar();
});
