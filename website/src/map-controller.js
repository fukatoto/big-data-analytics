import * as maplibregl from 'maplibre-gl';
import { airportBounds, airportViewPadding, places } from './config.js';

export function createMapController({ map, t, onSelectProjectArea }) {
  const state = {
    dimension: '3d',
    view: 'campus',
    caption: 'campus',
    selected: 'tegeler-stadtheide',
    terminalPlacesVisible: false
  };
  const markerElements = new Map();

  function placeName(place) {
    return place.nameKey ? t(place.nameKey) : place.name;
  }

  function setActiveButtons(selector, activeValue, attribute) {
    document.querySelectorAll(selector).forEach((button) => {
      const active = button.getAttribute(attribute) === activeValue;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function updateCaption() {
    let number = '01';
    let label = t('terminalCampus');
    if (state.caption === 'airport') {
      number = '02';
      label = t('formerAirportArea');
    } else if (state.caption === 'place') {
      const place = places[state.selected];
      number = place.number.slice(0, 2);
      label = placeName(place).toUpperCase();
    }
    document.getElementById('map-caption').innerHTML = `<span class="caption-line" aria-hidden="true"></span><span>${number} <span class="caption-slash">/</span> ${label}</span>`;
  }

  function updateSelectedPlace() {
    const place = places[state.selected];
    if (!place) return;
    document.getElementById('detail-kicker-label').textContent = t(
      place.projectAreaId ? 'selectedProjectArea' : 'selectedPlace'
    );
    document.getElementById('detail-title').textContent = placeName(place);
    document.getElementById('detail-number').textContent = place.number;
    document.getElementById('edition-number').textContent = place.number;
    document.getElementById('detail-description').textContent = t(place.descriptionKey);
    document.getElementById('detail-link').href = place.source;
  }

  function refreshLanguage() {
    updateSelectedPlace();
    updateCaption();
    markerElements.forEach((element, id) => {
      element.setAttribute('aria-label', t('showPlace', { place: placeName(places[id]) }));
    });
  }

  function selectPlace(id, fly = true) {
    const place = places[id];
    if (!place) return;
    state.selected = id;
    state.view = place.bounds ? 'project-area' : 'campus';
    state.caption = 'place';
    if (place.projectAreaId) onSelectProjectArea?.(place.projectAreaId);
    updateSelectedPlace();
    updateCaption();
    setActiveButtons('.place-item', id, 'data-place');
    setActiveButtons(
      '.map-actions button',
      id === 'tegeler-stadtheide' ? 'stadtheide-view' : null,
      'id'
    );
    markerElements.forEach((element, key) => element.classList.toggle('is-selected', key === id));
    if (fly) {
      if (place.bounds) {
        map.fitBounds(place.bounds, {
          padding: airportViewPadding(),
          pitch: state.dimension === '3d' ? 45 : 0,
          bearing: state.dimension === '3d' ? -12 : 0,
          duration: 1200,
          essential: true
        });
      } else {
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
  }

  function setTerminalPlacesVisible(visible) {
    state.terminalPlacesVisible = visible;
    const toggle = document.getElementById('terminal-places-toggle');
    toggle.classList.toggle('is-active', visible);
    toggle.setAttribute('aria-checked', String(visible));
    document.getElementById('terminal-places').hidden = !visible;
    markerElements.forEach((element, id) => {
      if (!places[id].projectAreaId) element.hidden = !visible;
    });
    if (!visible && !places[state.selected].projectAreaId) {
      selectPlace('tegeler-stadtheide', false);
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
      map.easeTo({
        pitch: dimension === '3d' ? 58 : 0,
        bearing: dimension === '3d' ? -24 : 0,
        duration: 750
      });
    }
  }

  function showAirport() {
    state.view = 'airport';
    state.caption = 'airport';
    setActiveButtons('.map-actions button', 'airport-view', 'id');
    updateCaption();
    map.fitBounds(airportBounds, {
      padding: airportViewPadding(),
      pitch: state.dimension === '3d' ? 48 : 0,
      bearing: state.dimension === '3d' ? -15 : 0,
      duration: 1200,
      essential: true
    });
  }

  function constrainAirportView() {
    const overviewCamera = map.cameraForBounds(airportBounds, { padding: airportViewPadding() });
    if (overviewCamera) map.setMinZoom(overviewCamera.zoom);
  }

  function addBuildingLayer() {
    map.addSource('txl-buildings', { type: 'vector', url: 'https://tiles.openfreemap.org/planet' });
    const firstLabel = map.getStyle().layers.find(
      (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;
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
      if (!place.coordinates) continue;
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'map-marker ' + (id === state.selected ? 'is-selected' : '');
      marker.hidden = !place.projectAreaId && !state.terminalPlacesVisible;
      marker.setAttribute('aria-label', t('showPlace', { place: placeName(place) }));
      marker.innerHTML = `<span class="marker-core" aria-hidden="true"></span><span class="marker-label">${placeName(place)}</span>`;
      marker.addEventListener('click', () => selectPlace(id));
      markerElements.set(id, marker);
      new maplibregl.Marker({
        element: marker,
        anchor: 'center',
        pitchAlignment: 'viewport',
        rotationAlignment: 'viewport',
        subpixelPositioning: true
      }).setLngLat(place.coordinates).addTo(map);
    }
  }

  function bindUi() {
    document.querySelectorAll('.place-item').forEach((button) => {
      button.addEventListener('click', () => selectPlace(button.dataset.place));
    });
    document.getElementById('view-2d').addEventListener('click', () => setDimension('2d'));
    document.getElementById('view-3d').addEventListener('click', () => setDimension('3d'));
    document.getElementById('stadtheide-view').addEventListener('click', () => {
      selectPlace('tegeler-stadtheide');
    });
    document.getElementById('terminal-places-toggle').addEventListener('click', () => {
      setTerminalPlacesVisible(!state.terminalPlacesVisible);
    });
    document.getElementById('airport-view').addEventListener('click', showAirport);
  }

  return {
    addBuildingLayer,
    addMarkers,
    bindUi,
    constrainAirportView,
    refreshLanguage
  };
}
