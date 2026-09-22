import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import './style.css';
import { createBasemapController } from './basemap-controller.js';
import { createBeeModeController } from './bee-mode-controller.js';
import { airportNavigationBounds, campusCamera } from './config.js';
import { createGroundHeightOverlay } from './ground-height-overlay.js';
import { createLocalization } from './localization.js';
import { createMapController } from './map-controller.js';
import { createProjectAreasOverlay } from './project-areas-overlay.js';

maplibregl.setWorkerUrl(workerUrl);

const localization = createLocalization('de');
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/bright',
  ...campusCamera,
  maxBounds: airportNavigationBounds,
  maxZoom: 19,
  maxPitch: 75,
  canvasContextAttributes: { antialias: true },
  attributionControl: false,
});

const mobileViewport = window.matchMedia('(max-width: 700px)');
const attributionControl = new maplibregl.AttributionControl({
  compact: mobileViewport.matches,
});
map.addControl(attributionControl, 'bottom-right');

function collapseMobileAttribution() {
  if (!mobileViewport.matches) return;
  document
    .querySelector('.maplibregl-ctrl-attrib')
    ?.classList.remove('maplibregl-compact-show');
}

collapseMobileAttribution();
map.addControl(
  new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
  'bottom-right',
);

const projectAreasOverlay = createProjectAreasOverlay({
  map,
  t: localization.t,
});
const basemapController = createBasemapController({
  map,
  t: localization.t,
});
const beeModeController = createBeeModeController({
  t: localization.t,
});
const mapController = createMapController({
  map,
  t: localization.t,
  onSelectProjectArea: projectAreasOverlay.showArea,
});
const groundHeightOverlay = createGroundHeightOverlay({
  map,
  t: localization.t,
  createTranslatedError: localization.createTranslatedError,
  onPanelVisibilityChange(visible) {
    if (!mobileViewport.matches) return;
    const panel = document.querySelector('.height-control');
    if (visible) closeMobilePanels(panel);
    else if (panel.classList.contains('is-mobile-open')) closeMobilePanels();
  },
});

const appShell = document.querySelector('.app-shell');
const sidebarToggle = document.getElementById('sidebar-toggle');
let sidebarResizeTimer;

function readSavedSidebarState() {
  try {
    return localStorage.getItem('txl-sidebar-collapsed') === 'true';
  } catch {
    return false;
  }
}

function saveSidebarState(collapsed) {
  try {
    localStorage.setItem('txl-sidebar-collapsed', String(collapsed));
  } catch {
    // The sidebar still works when browser storage is unavailable.
  }
}

function updateSidebarState(collapsed, persist = true) {
  appShell.classList.toggle('is-sidebar-collapsed', collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.dataset.i18nAria = collapsed ? 'showSidebar' : 'hideSidebar';
  sidebarToggle.setAttribute(
    'aria-label',
    localization.t(sidebarToggle.dataset.i18nAria),
  );

  if (persist) saveSidebarState(collapsed);
  window.clearTimeout(sidebarResizeTimer);
  sidebarResizeTimer = window.setTimeout(() => map.resize(), 300);
}

updateSidebarState(readSavedSidebarState(), false);
sidebarToggle.addEventListener('click', () => {
  updateSidebarState(!appShell.classList.contains('is-sidebar-collapsed'));
});

function closeMobilePanels(exceptPanel = null) {
  let hasOpenPanel = false;
  document.querySelectorAll('.mobile-map-panel').forEach((panel) => {
    const keepOpen = panel === exceptPanel;
    panel.classList.toggle('is-mobile-open', keepOpen);
    panel
      .querySelector('.mobile-panel-toggle')
      ?.setAttribute('aria-expanded', String(keepOpen));
    hasOpenPanel ||= keepOpen;
  });
  document
    .querySelector('.map-stage')
    .classList.toggle('has-mobile-panel-open', hasOpenPanel);
}

document.querySelectorAll('.mobile-panel-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.closest('.mobile-map-panel');
    closeMobilePanels(
      panel.classList.contains('is-mobile-open') ? null : panel,
    );
  });
});
document.querySelectorAll('.desktop-panel-collapse').forEach((button) => {
  button.addEventListener('click', () => {
    const panel = button.closest('.mobile-map-panel');
    const collapsed = panel.classList.toggle('is-desktop-collapsed');
    button.setAttribute('aria-expanded', String(!collapsed));
  });
});
document
  .getElementById('map')
  .addEventListener('click', () => closeMobilePanels());

localization.subscribe(() => {
  basemapController.refreshLanguage();
  beeModeController.refreshLanguage();
  mapController.refreshLanguage();
  projectAreasOverlay.refreshLanguage();
  groundHeightOverlay.refreshLanguage();
});

mapController.bindUi();
basemapController.bindUi();
beeModeController.bindUi();
mapController.loadEvents();
projectAreasOverlay.bindUi();
groundHeightOverlay.bindUi();
document
  .getElementById('height-threshold')
  .addEventListener('input', groundHeightOverlay.scheduleUpdate);
document
  .getElementById('language-select')
  .addEventListener('change', (event) => {
    localization.applyLanguage(event.target.value);
  });

map.on('load', () => {
  collapseMobileAttribution();
  mapController.constrainAirportView();
  basemapController.addLayer();
  mapController.addBuildingLayer();
  projectAreasOverlay.addLayers();
  mapController.addMarkers();
  groundHeightOverlay.addForestMarker();
  groundHeightOverlay.load().catch(groundHeightOverlay.showError);

  document.getElementById('airport-view').click();
});

map.on('resize', mapController.constrainAirportView);

map.on('moveend', () => {
  const center = map.getCenter();
  document.getElementById('map-coordinates').textContent =
    center.lat.toFixed(3) + '° N · ' + center.lng.toFixed(3) + '° E';
});

map.on('error', (event) => {
  if (!event?.error) return;
  const message = String(event.error.message || event.error);
  if (/Failed to fetch|NetworkError/i.test(message)) {
    document.getElementById('map-error').hidden = false;
  }
});

localization.applyLanguage(localization.language);
