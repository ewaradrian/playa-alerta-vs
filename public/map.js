const centroPlaya = [20.6296, -87.0739];

const qrooBounds = L.latLngBounds(
  [20.3000, -87.4000], 
  [20.8000, -86.8000]  
);

const map = L.map('map', {
  center: centroPlaya,
  zoom: 14,
  minZoom: 12,
  maxZoom: 18,
  maxBounds: qrooBounds,
  maxBoundsViscosity: 1.0,
  zoomControl: false 
});

L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors Playa Alerta',
  updateWhenIdle: true,
  keepBuffer: 2
}).addTo(map);