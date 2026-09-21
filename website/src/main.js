import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import './style.css';

maplibregl.setWorkerUrl(workerUrl);

const places = {
  'terminal-a': {
    name: 'Terminal A', number: '01 / 03', coordinates: [13.2889469, 52.5544223],
    description: "The airport's distinctive hexagonal terminal is planned as a campus for Berliner Hochschule für Technik.",
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/'
  },
  'terminal-b': {
    name: 'Terminal B', number: '02 / 03', coordinates: [13.2920506, 52.5541399],
    description: 'The former terminal is being developed into a centre for founders and innovation, with workspace, events and food.',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/'
  },
  'terminal-d': {
    name: 'Terminal D', number: '03 / 03', coordinates: [13.2916620, 52.5523579],
    description: 'A technology centre with laboratories, offices and workshops is planned for the former terminal.',
    source: 'https://urbantechrepublic.de/en/faq/'
  }
};

const campusCamera = { center: [13.2904, 52.5540], zoom: 15.95, pitch: 58, bearing: -24 };
const airportBounds = [[13.256, 52.5478], [13.308, 52.5657]];
const state = { dimension: '3d', view: 'campus', selected: 'terminal-a' };
const markerElements = new Map();

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/bright',
  ...campusCamera,
  minZoom: 11,
  maxZoom: 19,
  maxPitch: 75,
  canvasContextAttributes: { antialias: true },
  attributionControl: false
});

map.addControl(new maplibregl.AttributionControl({ compact: window.innerWidth < 700 }), 'bottom-right');
map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-right');

function setActiveButtons(selector, activeValue, attribute) {
  document.querySelectorAll(selector).forEach((button) => {
    const active = button.getAttribute(attribute) === activeValue;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function selectPlace(id, fly = true) {
  const place = places[id];
  if (!place) return;
  state.selected = id;
  state.view = 'campus';
  document.getElementById('detail-title').textContent = place.name;
  document.getElementById('detail-number').textContent = place.number;
  document.getElementById('edition-number').textContent = place.number;
  document.getElementById('detail-description').textContent = place.description;
  document.getElementById('detail-link').href = place.source;
  document.getElementById('map-caption').innerHTML = '<span class="caption-line" aria-hidden="true"></span><span>' + place.number.slice(0, 2) + ' <span class="caption-slash">/</span> ' + place.name.toUpperCase() + '</span>';
  setActiveButtons('.place-item', id, 'data-place');
  setActiveButtons('.map-actions button', 'campus-view', 'id');
  markerElements.forEach((element, key) => element.classList.toggle('is-selected', key === id));
  if (fly) {
    map.flyTo({
      center: place.coordinates,
      zoom: state.dimension === '3d' ? 16.65 : 16.3,
      pitch: state.dimension === '3d' ? 60 : 0,
      bearing: state.dimension === '3d' ? -24 : 0,
      speed: 0.8,
      essential: true
    });
  }
}

function setDimension(dimension) {
  state.dimension = dimension;
  setActiveButtons('.view-switch button', 'view-' + dimension, 'id');
  if (map.getLayer('txl-3d-buildings')) {
    map.setLayoutProperty('txl-3d-buildings', 'visibility', dimension === '3d' ? 'visible' : 'none');
  }
  if (state.view === 'airport') {
    showAirport();
  } else {
    map.easeTo({ pitch: dimension === '3d' ? 58 : 0, bearing: dimension === '3d' ? -24 : 0, duration: 750 });
  }
}

function showCampus() {
  state.view = 'campus';
  setActiveButtons('.map-actions button', 'campus-view', 'id');
  document.getElementById('map-caption').innerHTML = '<span class="caption-line" aria-hidden="true"></span><span>01 <span class="caption-slash">/</span> TERMINAL CAMPUS</span>';
  map.flyTo({ ...campusCamera, pitch: state.dimension === '3d' ? campusCamera.pitch : 0, bearing: state.dimension === '3d' ? campusCamera.bearing : 0, speed: 0.75, essential: true });
}

function showAirport() {
  state.view = 'airport';
  setActiveButtons('.map-actions button', 'airport-view', 'id');
  document.getElementById('map-caption').innerHTML = '<span class="caption-line" aria-hidden="true"></span><span>02 <span class="caption-slash">/</span> FORMER AIRPORT AREA</span>';
  map.fitBounds(airportBounds, {
    padding: window.innerWidth < 700 ? 52 : 100,
    pitch: state.dimension === '3d' ? 48 : 0,
    bearing: state.dimension === '3d' ? -15 : 0,
    duration: 1200,
    essential: true
  });
}

function addBuildingLayer() {
  map.addSource('txl-buildings', { type: 'vector', url: 'https://tiles.openfreemap.org/planet' });
  const firstLabel = map.getStyle().layers.find((layer) => layer.type === 'symbol' && layer.layout?.['text-field'])?.id;
  map.addLayer({
    id: 'txl-3d-buildings',
    source: 'txl-buildings',
    'source-layer': 'building',
    type: 'fill-extrusion',
    minzoom: 14.5,
    filter: ['!=', ['get', 'hide_3d'], true],
    paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'render_height'], 0, '#b4c2bd', 30, '#8daea9', 80, '#577b7e'],
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.5, ['coalesce', ['get', 'render_height'], 8]],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.88
    }
  }, firstLabel);
}

function addMarkers() {
  for (const [id, place] of Object.entries(places)) {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'map-marker ' + (id === state.selected ? 'is-selected' : '');
    marker.setAttribute('aria-label', 'Show ' + place.name);
    marker.innerHTML = '<span class="marker-core" aria-hidden="true"></span><span class="marker-label">' + place.name + '</span>';
    marker.addEventListener('click', () => selectPlace(id));
    markerElements.set(id, marker);
    new maplibregl.Marker({ element: marker, anchor: 'bottom' }).setLngLat(place.coordinates).addTo(map);
  }
}

map.on('load', () => {
  addBuildingLayer();
  addMarkers();
});

map.on('moveend', () => {
  const center = map.getCenter();
  document.getElementById('map-coordinates').textContent = center.lat.toFixed(3) + '° N · ' + center.lng.toFixed(3) + '° E';
});

map.on('error', (event) => {
  if (!event?.error) return;
  const message = String(event.error.message || event.error);
  if (/Failed to fetch|NetworkError/i.test(message)) document.getElementById('map-error').hidden = false;
});

document.querySelectorAll('.place-item').forEach((button) => {
  button.addEventListener('click', () => selectPlace(button.dataset.place));
});
document.getElementById('view-2d').addEventListener('click', () => setDimension('2d'));
document.getElementById('view-3d').addEventListener('click', () => setDimension('3d'));
document.getElementById('campus-view').addEventListener('click', showCampus);
document.getElementById('airport-view').addEventListener('click', showAirport);
