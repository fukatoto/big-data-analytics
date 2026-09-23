import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { createAnalysisPanelLayout } from './analysis-panel-layout.js';
import { createBasemapController } from './basemap-controller.js';
import { airportNavigationBounds, campusCamera } from './config.js';
import { createGroundHeightOverlay } from './ground-height-overlay.js';
import { createLocalization } from './localization.js';
import { createMapController } from './map-controller.js';
import { createProjectAreasOverlay } from './project-areas-overlay.js';
import { createTreeHealthOverlay } from './tree-health-overlay.js';

maplibregl.setWorkerUrl(workerUrl);

export function startMap({ atlas, onCoordinatesChange, onMapError, onProjectAreasChange, onInternalViewChange, onEventFilterChange } = {}) {
  const localization = createLocalization();
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
    onChange: onProjectAreasChange,
  });
  const basemapController = createBasemapController({
    map,
  });
  const mapController = createMapController({
    map,
    t: localization.t,
    onSelectProjectArea: projectAreasOverlay.showArea,
    onEventFilterChange,
    state: atlas,
  });
  const treeHealthOverlay = createTreeHealthOverlay({
    map,
    t: localization.t,
    filters: atlas.treeFilters,
  });
  const panelLayout = createAnalysisPanelLayout({ mobileViewport });
  const groundHeightOverlay = createGroundHeightOverlay({
    map,
    t: localization.t,
    state: atlas.heightAnalysis,
    createTranslatedError: localization.createTranslatedError,
    getTreeHealthBounds: treeHealthOverlay.getBounds,
    onTreeHealthVisibilityChange(visible) {
      const wasVisible = !document.querySelector('.tree-health-control').hidden;
      treeHealthOverlay.setTreeHealthVisible(visible);
      panelLayout.treeVisibilityChanged(wasVisible, visible);
    },
    onPanelVisibilityChange() {
      panelLayout.heightVisibilityChanged();
    },
    onMobilePanelSelectionChange(activeLayers) {
      panelLayout.selectMobilePanel(activeLayers);
    },
    onInternalViewChange,
  });

  let sidebarResizeTimer;

  function scheduleSidebarResize() {
    window.clearTimeout(sidebarResizeTimer);
    sidebarResizeTimer = window.setTimeout(() => map.resize(), 300);
  }

  scheduleSidebarResize();

  localization.subscribe(() => {
    mapController.refreshLanguage();
    projectAreasOverlay.refreshLanguage();
  });

  mapController.loadEvents();
  map.on('load', () => {
    collapseMobileAttribution();
    mapController.constrainAirportView();
    basemapController.addLayer();
    mapController.addBuildingLayer();
    projectAreasOverlay.addLayers();
    treeHealthOverlay.addTrees()
      .then(groundHeightOverlay.refocusIfOpen)
      .catch((error) => console.error(error));
    mapController.addMarkers();
    groundHeightOverlay.load().catch(groundHeightOverlay.showError);

    mapController.showAirport();
  });

  map.on('resize', mapController.constrainAirportView);

  map.on('moveend', () => {
    const center = map.getCenter();
    onCoordinatesChange?.(
      center.lat.toFixed(3) + '° N · ' + center.lng.toFixed(3) + '° E',
    );
  });

  map.on('error', (event) => {
    if (!event?.error) return;
    const message = String(event.error.message || event.error);
    if (/Failed to fetch|NetworkError/i.test(message)) {
      onMapError?.();
    }
  });

  localization.applyLanguage(localization.language);
  return {
    map,
    localization,
    scheduleSidebarResize,
    setSatelliteVisible: basemapController.setSatelliteVisible,
    toggleProjectArea: projectAreasOverlay.toggleArea,
    setAllProjectAreasVisible: projectAreasOverlay.setAllAreasVisible,
    toggleProjectAreaFill: projectAreasOverlay.toggleFill,
    setInternalViewOpen: groundHeightOverlay.setInternalViewOpen,
    toggleInternalLayer: groundHeightOverlay.toggleInternalLayer,
    setAllInternalLayersVisible: groundHeightOverlay.setAllInternalLayersVisible,
    selectPlace: mapController.selectPlace,
    setPlacesVisible: mapController.setPlacesVisible,
    setDimension: mapController.setDimension,
    showAirport: mapController.showAirport,
    selectEvent: mapController.selectEvent,
    closeEvent: mapController.closeEvent,
    refreshEventPopup: mapController.refreshEventPopup,
    setTreeFilters: treeHealthOverlay.setTreeFilters,
    scheduleHeightUpdate: groundHeightOverlay.scheduleUpdate,
  };
}
