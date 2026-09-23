import * as maplibregl from 'maplibre-gl';
import { groundHeightConfig } from './config.js';
import { parseGroundHeightCsv } from './ground-height-analysis.js';
import { formatDecimal } from './number-format.js';

export function createGroundHeightOverlay({ map, t, state, createTranslatedError, getTreeHealthBounds, onPanelVisibilityChange, onTreeHealthVisibilityChange, onMobilePanelSelectionChange, onInternalViewChange }) {
  const updateDelay = 200;
  let samples = [];
  let reference = null;
  let referenceHeight = null;
  let sampleCount = 0;
  let loadError = null;
  let analysisInitialized = false;
  let internalViewOpen = false;
  const activeInternalLayers = new Set(['tree-health', 'tree', 'depression']);
  let popup = null;
  let updateTimer = null;

  function measurementIconExpression(threshold) {
    const status = [
      'case',
      ['>=', ['get', 'heightDifference'], threshold],
      'obstacle',
      'clear',
    ];
    return [
      'match',
      ['get', 'kind'],
      'person', 'person-marker',
      'tree', ['concat', 'tree-', status],
      'depression', ['concat', 'depression-', status],
      ['concat', 'measurement-', status],
    ];
  }

  function createMarkerImage(kind, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (kind === 'person') {
      context.beginPath();
      context.arc(24, 9, 5, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = '#173b32';
      context.lineWidth = 2.5;
      context.stroke();

      const drawBody = (strokeStyle, lineWidth) => {
        context.beginPath();
        context.moveTo(24, 17);
        context.lineTo(24, 31);
        context.moveTo(24, 21);
        context.lineTo(13, 28);
        context.moveTo(24, 21);
        context.lineTo(35, 28);
        context.moveTo(24, 31);
        context.lineTo(16, 43);
        context.moveTo(24, 31);
        context.lineTo(32, 43);
        context.strokeStyle = strokeStyle;
        context.lineWidth = lineWidth;
        context.stroke();
      };
      drawBody('#173b32', 7);
      drawBody(color, 4);
    } else if (kind === 'tree') {
      context.beginPath();
      context.moveTo(24, 4);
      context.lineTo(11, 23);
      context.lineTo(17, 23);
      context.lineTo(8, 35);
      context.lineTo(21, 35);
      context.lineTo(21, 44);
      context.lineTo(27, 44);
      context.lineTo(27, 35);
      context.lineTo(40, 35);
      context.lineTo(31, 23);
      context.lineTo(37, 23);
      context.closePath();
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = '#173b32';
      context.lineWidth = 2.5;
      context.stroke();
    } else if (kind === 'depression') {
      const drawBowl = (strokeStyle, lineWidth) => {
        context.beginPath();
        context.moveTo(6, 13);
        context.bezierCurveTo(13, 40, 35, 40, 42, 13);
        context.strokeStyle = strokeStyle;
        context.lineWidth = lineWidth;
        context.stroke();
      };
      drawBowl('#173b32', 8);
      drawBowl(color, 5);
    } else if (kind === 'reference') {
      context.beginPath();
      context.moveTo(24, 3);
      context.lineTo(30, 17);
      context.lineTo(45, 24);
      context.lineTo(30, 31);
      context.lineTo(24, 45);
      context.lineTo(18, 31);
      context.lineTo(3, 24);
      context.lineTo(18, 17);
      context.closePath();
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = '#173b32';
      context.lineWidth = 2.5;
      context.stroke();
      context.beginPath();
      context.arc(24, 24, 5, 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.fill();
    } else {
      context.beginPath();
      context.moveTo(24, 5);
      context.lineTo(43, 24);
      context.lineTo(24, 43);
      context.lineTo(5, 24);
      context.closePath();
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = '#173b32';
      context.lineWidth = 2.5;
      context.stroke();
    }

    return context.getImageData(0, 0, canvas.width, canvas.height);
  }

  function registerMeasurementIcons() {
    const variants = [
      ['tree-clear', 'tree', groundHeightConfig.colors.clear],
      ['tree-obstacle', 'tree', groundHeightConfig.colors.obstacle],
      ['depression-clear', 'depression', groundHeightConfig.colors.clear],
      ['depression-obstacle', 'depression', groundHeightConfig.colors.obstacle],
      ['measurement-clear', 'measurement', groundHeightConfig.colors.clear],
      ['measurement-obstacle', 'measurement', groundHeightConfig.colors.obstacle],
      ['person-marker', 'person', groundHeightConfig.colors.reference],
      ['reference-marker', 'reference', groundHeightConfig.colors.reference],
    ];
    variants.forEach(([name, kind, color]) => {
      if (!map.hasImage(name)) {
        map.addImage(name, createMarkerImage(kind, color), { pixelRatio: 2 });
      }
    });
  }

  function createMeasurementFeatures() {
    const toFeature = (sample, isReference = false) => {
      return {
        type: 'Feature',
        properties: {
          label: sample.label,
          kind: sampleKind(sample),
          isReference,
          groundHeight: Number(sample.groundHeight.toFixed(3)),
          referenceHeight: Number(referenceHeight.toFixed(3)),
          heightDifference: Number(Math.abs(sample.groundHeight - referenceHeight).toFixed(3)),
        },
        geometry: {
          type: 'Point',
          coordinates: [sample.longitude, sample.latitude],
        },
      };
    };

    const annotations = groundHeightConfig.annotations.map((annotation) => ({
      type: 'Feature',
      properties: {
        label: annotation.label,
        kind: annotation.kind,
        isReference: false,
        isAnnotation: true,
      },
      geometry: {
        type: 'Point',
        coordinates: annotation.coordinates,
      },
    }));

    return [
      ...samples.map((sample) => toFeature(sample)),
      ...annotations,
      toFeature(reference, true),
    ];
  }

  function sampleKind(sample) {
    const label = sample.label.trim().toLowerCase();
    if (label.startsWith('baum')) return 'tree';
    if (label.startsWith('kuhle')) return 'depression';
    return 'measurement';
  }

  function visibleSamples() {
    return samples.filter((sample) => activeInternalLayers.has(sampleKind(sample)));
  }

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>'"]/g,
      (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character],
    );
  }

  function refreshStatus() {
    state.visibleSamples = sampleCount ? visibleSamples().length : null;
    state.error = loadError && {
      key: loadError.translationKey,
      variables: loadError.translationVariables,
      message: loadError.message,
    };
  }

  function measurementFilter() {
    const selectedKinds = ['tree', 'depression'].filter((kind) => activeInternalLayers.has(kind));
    const kinds = internalViewOpen && selectedKinds.length ? [...selectedKinds, 'person'] : [];
    return [
      'all',
      ['==', ['get', 'isReference'], false],
      ['in', ['get', 'kind'], ['literal', kinds]],
    ];
  }

  function measurementsVisible() {
    return internalViewOpen &&
      (activeInternalLayers.has('tree') || activeInternalLayers.has('depression'));
  }

  function updateMapVisibility() {
    const showMeasurements = measurementsVisible();
    const panel = document.querySelector('.height-control');
    const panelWasHidden = panel.hidden;
    panel.hidden = !showMeasurements;
    state.enabled = showMeasurements && analysisInitialized;
    if (showMeasurements && panelWasHidden) {
      panel.classList.remove('is-desktop-collapsed');
      panel.querySelector('.desktop-panel-collapse').setAttribute('aria-expanded', 'true');
    }
    if (panelWasHidden !== panel.hidden) onPanelVisibilityChange?.(showMeasurements);
    const visibility = showMeasurements ? 'visible' : 'none';
    [groundHeightConfig.measurementLayerId, groundHeightConfig.measurementLabelLayerId].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setFilter(layerId, measurementFilter());
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
    if (map.getLayer(groundHeightConfig.referenceLayerId)) {
      map.setLayoutProperty(groundHeightConfig.referenceLayerId, 'visibility', visibility);
    }
    onTreeHealthVisibilityChange?.(internalViewOpen && activeInternalLayers.has('tree-health'));
    if (!showMeasurements) {
      map.getCanvas().style.cursor = '';
      popup?.remove();
    }
    if (analysisInitialized) update();
    refreshStatus();
  }

  function syncInternalView() {
    if (measurementsVisible() && samples.length && !analysisInitialized && !loadError) {
      try {
        initializeAnalysis();
      } catch (error) {
        showError(error);
      }
    }
    updateMapVisibility();
  }

  function focusInternalView() {
    const bounds = new maplibregl.LngLatBounds();
    if (measurementsVisible()) {
      visibleSamples().forEach(({ longitude, latitude }) => bounds.extend([longitude, latitude]));
      if (reference) bounds.extend([reference.longitude, reference.latitude]);
    }
    if (activeInternalLayers.has('tree-health')) {
      const treeBounds = getTreeHealthBounds?.();
      if (treeBounds && !treeBounds.isEmpty()) {
        bounds.extend(treeBounds.getSouthWest());
        bounds.extend(treeBounds.getNorthEast());
      }
    }
    if (bounds.isEmpty()) return;

    const mapRect = map.getContainer().getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const topbar = document.querySelector('.map-topbar').getBoundingClientRect();
    const visiblePanels = [...document.querySelectorAll('.height-control')]
      .filter((panel) => !panel.hidden)
      .map((panel) => panel.getBoundingClientRect());
    const padding = {
      top: Math.max(60, topbar.bottom - mapRect.top + 20,
        ...(mobile ? visiblePanels.map((rect) => rect.bottom - mapRect.top + 20) : [])),
      bottom: mobile
        ? mapRect.bottom - document.querySelector('.sidebar').getBoundingClientRect().top + 24
        : 80,
      left: 35,
      right: mobile ? 35 : Math.min(mapRect.width * 0.4, 35 + Math.max(0,
        ...visiblePanels.map((rect) => mapRect.right - rect.left))),
    };
    map.fitBounds(bounds, {
      padding,
      pitch: 40,
      bearing: 0,
      maxZoom: 16,
      duration: 800,
      essential: true,
    });
  }

  function update() {
    const threshold = state.threshold;

    if (map.getLayer(groundHeightConfig.measurementLayerId)) {
      map.setLayoutProperty(
        groundHeightConfig.measurementLayerId,
        'icon-image',
        measurementIconExpression(threshold),
      );
    }

    const selectedSamples = visibleSamples();
    const obstacles = selectedSamples.filter(
      (sample) => Math.abs(sample.groundHeight - referenceHeight) >= threshold,
    ).length;
    state.obstacles = obstacles;
    state.clear = selectedSamples.length - obstacles;
  }

  function scheduleUpdate() {
    window.clearTimeout(updateTimer);
    updateTimer = window.setTimeout(() => {
      updateTimer = null;
      update();
    }, updateDelay);
  }

  function initializeAnalysis() {
    if (analysisInitialized) return;

    const threshold = state.threshold;
    registerMeasurementIcons();
    map.addSource(groundHeightConfig.measurementSourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: createMeasurementFeatures() },
    });
    map.addLayer({
      id: groundHeightConfig.measurementLayerId,
      source: groundHeightConfig.measurementSourceId,
      type: 'symbol',
      filter: measurementFilter(),
      layout: {
        visibility: 'none',
        'icon-image': measurementIconExpression(threshold),
        'icon-size': 1.15,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });
    map.addLayer({
      id: groundHeightConfig.referenceLayerId,
      source: groundHeightConfig.measurementSourceId,
      type: 'symbol',
      filter: ['==', ['get', 'isReference'], true],
      layout: {
        visibility: 'none',
        'icon-image': 'reference-marker',
        'icon-size': 1.15,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });
    map.addLayer({
      id: groundHeightConfig.measurementLabelLayerId,
      source: groundHeightConfig.measurementSourceId,
      type: 'symbol',
      minzoom: 18,
      filter: measurementFilter(),
      layout: {
        visibility: 'none',
        'text-field': ['get', 'label'],
        'text-size': 11,
        'text-font': ['Noto Sans Regular'],
        'text-anchor': 'top',
        'text-offset': [0, 1],
        'text-optional': true,
      },
      paint: {
        'text-color': '#17211e',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });
    analysisInitialized = true;
    state.enabled = measurementsVisible();
    addPopupInteraction();
    updateMapVisibility();
  }

  function publishInternalView() {
    const selectedLayers = internalViewOpen ? [...activeInternalLayers] : [];
    onInternalViewChange?.(internalViewOpen, [...activeInternalLayers]);
    onMobilePanelSelectionChange?.(selectedLayers);
  }

  function setInternalViewOpen(open) {
    internalViewOpen = open;
    syncInternalView();
    publishInternalView();
    if (!open) return;
    focusInternalView();
    if (window.matchMedia('(max-width: 700px)').matches) {
      requestAnimationFrame(() => {
        const options = document.getElementById('internal-view-options');
        const sidebar = document.querySelector('.sidebar');
        const hiddenBottom = options.getBoundingClientRect().bottom - sidebar.getBoundingClientRect().bottom;
        if (hiddenBottom > 0) sidebar.scrollBy({ top: hiddenBottom + 12, behavior: 'auto' });
      });
    }
  }

  function toggleInternalLayer(layer) {
    if (activeInternalLayers.has(layer)) activeInternalLayers.delete(layer);
    else activeInternalLayers.add(layer);
    syncInternalView();
    publishInternalView();
  }

  function setAllInternalLayersVisible(visible) {
    activeInternalLayers.clear();
    if (visible) ['tree-health', 'tree', 'depression'].forEach((layer) => activeInternalLayers.add(layer));
    syncInternalView();
    publishInternalView();
  }

  function showError(error) {
    loadError = error;
    document.querySelector('.height-control').classList.add('is-error');
    refreshStatus();
  }

  async function load() {
    const [heightResponse, boundaryResponse] = await Promise.all([
      fetch(groundHeightConfig.csvUrl),
      fetch(groundHeightConfig.boundaryUrl),
    ]);
    if (!heightResponse.ok) {
      throw createTranslatedError('heightCsvLoadError', { status: heightResponse.status });
    }
    if (!boundaryResponse.ok) {
      throw createTranslatedError('boundaryLoadError', { status: boundaryResponse.status });
    }

    ({ measurements: samples, reference, referenceHeight } = parseGroundHeightCsv(
      await heightResponse.text(),
      createTranslatedError,
    ));
    const boundaryData = await boundaryResponse.json();
    const boundaryFeature = boundaryData.features?.[0];
    if (boundaryFeature?.geometry?.type !== 'Polygon') {
      throw createTranslatedError('boundaryFormatError');
    }

    map.addSource(groundHeightConfig.boundarySourceId, { type: 'geojson', data: boundaryData });
    map.addLayer({
      id: groundHeightConfig.boundaryLayerId,
      source: groundHeightConfig.boundarySourceId,
      type: 'line',
      paint: {
        'line-color': groundHeightConfig.colors.boundary,
        'line-opacity': 0.9,
        'line-width': 2,
      },
    }, groundHeightConfig.beforeLayerId);

    sampleCount = samples.length;
    refreshStatus();
    syncInternalView();
    if (internalViewOpen) focusInternalView();
  }

  function addPopupInteraction() {
    popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'ground-height-map-popup',
      offset: 10,
    });
    const showPopup = (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const { groundHeight, referenceHeight: csvReference, heightDifference, label } =
        feature.properties;
      const isReference =
        feature.properties.isReference === true || feature.properties.isReference === 'true';
      const isAnnotation =
        feature.properties.isAnnotation === true || feature.properties.isAnnotation === 'true';
      const popupContent = isAnnotation
        ? `<strong>${escapeHtml(label)}</strong>`
        : isReference
          ? `<strong>${t('referencePoint')}</strong><br>${t('groundHeight', { height: formatDecimal(Number(groundHeight), 2) })}`
          : `<strong>${escapeHtml(label)}</strong><br>${t('groundHeight', { height: formatDecimal(Number(groundHeight), 2) })}<br>${t('localReference', { height: formatDecimal(Number(csvReference), 2) })}<br>${t('difference', { height: formatDecimal(Number(heightDifference) * 100, 1) })}`;
      map.getCanvas().style.cursor = 'pointer';
      popup
        .setLngLat(event.lngLat)
        .setHTML(`<div class="place-popup-body">${popupContent}</div>`)
        .addTo(map);
    };
    const hidePopup = () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    };
    map.on('mousemove', groundHeightConfig.measurementLayerId, showPopup);
    map.on('mouseleave', groundHeightConfig.measurementLayerId, hidePopup);
    map.on('mousemove', groundHeightConfig.referenceLayerId, showPopup);
    map.on('mouseleave', groundHeightConfig.referenceLayerId, hidePopup);
  }

  return {
    setInternalViewOpen,
    toggleInternalLayer,
    setAllInternalLayersVisible,
    refocusIfOpen: () => { if (internalViewOpen) focusInternalView(); },
    load,
    scheduleUpdate,
    showError,
  };
}
