import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import './style.css';
import './redesign.css';
import './dark-mode.css';
import './event-detail.css';
import { createBasemapController } from './basemap-controller.js';
import { createBeeModeController } from './bee-mode-controller.js';
import { airportNavigationBounds, campusCamera } from './config.js';
import { createGroundHeightOverlay } from './ground-height-overlay.js';
import { createLocalization } from './localization.js';
import { createMapController } from './map-controller.js';
import { createProjectAreasOverlay } from './project-areas-overlay.js';

maplibregl.setWorkerUrl(workerUrl);

const localization = createLocalization('de');
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme, persist = false) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  const label = localization.t(isDark ? 'darkModeDisable' : 'darkModeEnable');
  themeToggle.setAttribute('aria-label', label);
  themeToggle.title = label;
  document.querySelector('meta[name="theme-color"]').content =
    isDark ? '#101b1e' : '#fbfcf8';
  if (persist) {
    try {
      localStorage.setItem('txl-theme', isDark ? 'dark' : 'light');
    } catch {
      // The choice remains active for this visit.
    }
  }
}

applyTheme(document.documentElement.dataset.theme);
themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
});
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
  onTreeHealthVisibilityChange(visible) {
    const panel = document.querySelector('.tree-health-control');
    const wasVisible = !panel.hidden;
    mapController.setTreeHealthVisible(visible);
    if (wasVisible !== visible) autoCollapsedAnalysisPanels.delete(panel);
    updateAnalysisPanelPositions();
  },
  onPanelVisibilityChange() {
    autoCollapsedAnalysisPanels.delete(heightPanel);
    updateAnalysisPanelPositions();
  },
  onMobilePanelSelectionChange(activeLayers) {
    if (!mobileViewport.matches) return;
    const selectedPanel = activeLayers.length === 1
      ? (activeLayers[0] === 'tree-health' ? treeHealthPanel : heightPanel)
      : null;
    closeMobilePanels(selectedPanel);
  },
});

const appShell = document.querySelector('.app-shell');
const heightPanel = document.querySelector('.height-control:not(.tree-health-control)');
const treeHealthPanel = document.querySelector('.tree-health-control');
const mapStage = document.querySelector('.map-stage');
const mapActions = document.querySelector('.map-actions');
const autoCollapsedAnalysisPanels = new Set();
let lastAnalysisStageWidth = 0;
let lastAnalysisStageHeight = 0;
function setAnalysisPanelCollapsed(panel, collapsed) {
  panel.classList.toggle('is-desktop-collapsed', collapsed);
  panel.querySelector('.desktop-panel-collapse').setAttribute('aria-expanded', String(!collapsed));
}
function updateAnalysisPanelPositions(preferredPanel = null) {
  const stageWidth = mapStage.clientWidth;
  const stageHeight = mapStage.clientHeight;
  if (stageWidth !== lastAnalysisStageWidth || stageHeight !== lastAnalysisStageHeight) {
    autoCollapsedAnalysisPanels.forEach((panel) => setAnalysisPanelCollapsed(panel, false));
    autoCollapsedAnalysisPanels.clear();
    lastAnalysisStageWidth = stageWidth;
    lastAnalysisStageHeight = stageHeight;
  }
  let heightSize = heightPanel.getBoundingClientRect();
  let treeSize = treeHealthPanel.getBoundingClientRect();
  const treeRight = Math.min(74, Math.max(12, stageWidth -
    (treeHealthPanel.hidden ? heightSize.width : treeSize.width) - 12));
  const actionsRect = mapActions.getBoundingClientRect();
  const stageRect = mapStage.getBoundingClientRect();
  const stageLeft = stageRect.left;
  const topbarBottom = mapStage.querySelector('.map-topbar').getBoundingClientRect().bottom;
  const topClearance = Math.max(12, topbarBottom - stageRect.top + 12);
  const actionsLeft = actionsRect.left - stageLeft;
  const actionsRight = actionsRect.right - stageLeft;
  const overlapsActions = (right, width) => {
    const left = stageWidth - right - width;
    return left < actionsRight + 12 && stageWidth - right > actionsLeft - 12;
  };
  const besideRight = treeRight + treeSize.width + 12;
  const hasRoomBeside = !heightPanel.hidden && !treeHealthPanel.hidden &&
    stageWidth >= besideRight + heightSize.width + 8 &&
    !overlapsActions(besideRight, heightSize.width);
  const heightRight = hasRoomBeside ? besideRight : treeRight;
  const bothVisible = !heightPanel.hidden && !treeHealthPanel.hidden;
  if (hasRoomBeside) {
    autoCollapsedAnalysisPanels.forEach((panel) => setAnalysisPanelCollapsed(panel, false));
    autoCollapsedAnalysisPanels.clear();
  }
  const needsCameraClearance =
    (!treeHealthPanel.hidden && overlapsActions(treeRight, treeSize.width)) ||
    (!heightPanel.hidden && overlapsActions(heightRight, heightSize.width));
  const actionsBottom = Number.parseFloat(getComputedStyle(mapActions).bottom) || 51;
  const baseBottom = actionsBottom;
  const panelBottom = needsCameraClearance
    ? Math.max(baseBottom, actionsBottom + actionsRect.height + 12)
    : baseBottom;
  if (!mobileViewport.matches && bothVisible && !hasRoomBeside) {
    const otherPanel = preferredPanel === treeHealthPanel ? heightPanel : treeHealthPanel;
    if (panelBottom + heightSize.height + treeSize.height + 12 > stageHeight - topClearance &&
        !otherPanel.classList.contains('is-desktop-collapsed')) {
      setAnalysisPanelCollapsed(otherPanel, true);
      autoCollapsedAnalysisPanels.add(otherPanel);
      heightSize = heightPanel.getBoundingClientRect();
      treeSize = treeHealthPanel.getBoundingClientRect();
    }
    const remainingPanel = otherPanel === treeHealthPanel ? heightPanel : treeHealthPanel;
    if (panelBottom + heightSize.height + treeSize.height + 12 > stageHeight - topClearance &&
        !remainingPanel.classList.contains('is-desktop-collapsed')) {
      setAnalysisPanelCollapsed(remainingPanel, true);
      autoCollapsedAnalysisPanels.add(remainingPanel);
      heightSize = heightPanel.getBoundingClientRect();
      treeSize = treeHealthPanel.getBoundingClientRect();
    }
  }
  const heightBottom = hasRoomBeside || treeHealthPanel.hidden
    ? panelBottom
    : panelBottom + treeSize.height + 12;
  heightPanel.style.setProperty('--analysis-right', `${heightRight}px`);
  heightPanel.style.setProperty('--analysis-bottom', `${heightBottom}px`);
  treeHealthPanel.style.setProperty('--tree-health-bottom', `${panelBottom}px`);
  treeHealthPanel.style.setProperty('--tree-health-right', `${treeRight}px`);
}
const analysisPanelPositionObserver = new ResizeObserver(() => updateAnalysisPanelPositions());
analysisPanelPositionObserver.observe(heightPanel);
analysisPanelPositionObserver.observe(treeHealthPanel);
analysisPanelPositionObserver.observe(mapStage);
analysisPanelPositionObserver.observe(mapActions);
updateAnalysisPanelPositions();
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
    autoCollapsedAnalysisPanels.delete(panel);
    if (panel === heightPanel || panel === treeHealthPanel) updateAnalysisPanelPositions(panel);
  });
});
document
  .getElementById('map')
  .addEventListener('click', () => closeMobilePanels());

localization.subscribe(() => {
  applyTheme(document.documentElement.dataset.theme);
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
  mapController.addTrees().catch((error) => console.error(error));
  mapController.addMarkers();
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
