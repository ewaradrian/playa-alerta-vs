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

        /* Referencias cacheadas a los elementos del DOM */
        this.btnUsuario    = document.getElementById('btnUsuario');
        this.btnTrafico    = document.getElementById('btnTrafico');
        this.btnIncidencia = document.getElementById('btnIncidencia');
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
     * Al hacer click, crea un reporte del tipo "trafico".
     */
    _registrarEventoTrafico() {
        if (!this.btnTrafico) return;

        this.btnTrafico.addEventListener('click', () => {
            /* Delega la creación del reporte al método genérico */
            this._crearReporte('trafico');
        });
    }

    /**
     * _registrarEventoIncidencia()  [privado]
     * Configura el botón de reporte de incidencias viales.
     */
    _registrarEventoIncidencia() {
        if (!this.btnIncidencia) return;

        this.btnIncidencia.addEventListener('click', () => {
            this._crearReporte('incidencia');
        });
    }

    /**
     * _crearReporte(tipo)  [privado]
     * Lógica central de creación de reportes. Obtiene la posición
     * actual del centro visible del mapa y registra el evento.
     *
     * @param {string} tipo - Categoría del reporte ('trafico' | 'incidencia').
     */
    _crearReporte(tipo) {
        /* Obtiene el centro actual del mapa como objeto {lat, lng} */
        const centro = this.mapa.getCenter();

        /* Construye un objeto simple con los datos del reporte */
        const reporte = {
            tipo:      tipo,
            latitud:   centro.lat.toFixed(6),
            longitud:  centro.lng.toFixed(6),
            timestamp: new Date().toISOString() /* Marca de tiempo en formato ISO 8601 */
        };

        /* TODO: Enviar `reporte` al backend (fetch/API) en lugar de solo mostrarlo */
        console.log('[UIController] Nuevo reporte creado:', reporte);
        alert(`Reporte de "${tipo}" registrado en:\nLat: ${reporte.latitud}\nLng: ${reporte.longitud}`);
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
