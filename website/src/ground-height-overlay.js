import * as maplibregl from 'maplibre-gl';
import { groundHeightConfig } from './config.js';
import { parseGroundHeightCsv } from './ground-height-analysis.js';

export function createGroundHeightOverlay({ map, t, createTranslatedError }) {
  const updateDelay = 200;
  let samples = [];
  let reference = null;
  let referenceHeight = null;
  let sampleCount = 0;
  let loadError = null;
  let analysisVisible = false;
  let analysisInitialized = false;
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
      const normalizedLabel = sample.label.trim().toLowerCase();
      const kind = normalizedLabel.startsWith('baum')
        ? 'tree'
        : normalizedLabel.startsWith('kuhle')
          ? 'depression'
          : 'measurement';
      return {
        type: 'Feature',
        properties: {
          label: sample.label,
          kind,
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

  function formatThreshold(threshold) {
    return `${Math.round(threshold * 100)} cm`;
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
    const status = document.getElementById('height-data-status');
    if (loadError) {
      status.textContent = loadError.translationKey
        ? t(loadError.translationKey, loadError.translationVariables)
        : loadError.message;
    } else if (sampleCount) {
      status.textContent = t('dataStatus', { points: sampleCount });
    } else {
      status.textContent = t('loadingHeightData');
    }
  }

  function update() {
    const threshold = Number(document.getElementById('height-threshold').value);
    document.getElementById('height-threshold-value').textContent = formatThreshold(threshold);

    if (map.getLayer(groundHeightConfig.measurementLayerId)) {
      map.setLayoutProperty(
        groundHeightConfig.measurementLayerId,
        'icon-image',
        measurementIconExpression(threshold),
      );
    }

    const obstacles = samples.filter(
      (sample) => Math.abs(sample.groundHeight - referenceHeight) >= threshold,
    ).length;
    document.getElementById('obstacle-count').textContent = String(obstacles);
    document.getElementById('clear-count').textContent = String(samples.length - obstacles);
  }

  function scheduleUpdate() {
    const threshold = Number(document.getElementById('height-threshold').value);
    document.getElementById('height-threshold-value').textContent = formatThreshold(threshold);
    window.clearTimeout(updateTimer);
    updateTimer = window.setTimeout(() => {
      updateTimer = null;
      update();
    }, updateDelay);
  }

  function setAnalysisVisible(visible) {
    analysisVisible = visible;
    const button = document.getElementById('height-analysis-toggle');
    button.classList.toggle('is-active', analysisVisible);
    button.setAttribute('aria-checked', String(analysisVisible));
    document.getElementById('height-threshold').disabled = !analysisVisible;

    [
      groundHeightConfig.measurementLayerId,
      groundHeightConfig.referenceLayerId,
      groundHeightConfig.measurementLabelLayerId,
    ].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', analysisVisible ? 'visible' : 'none');
      }
    });

    if (!analysisVisible) {
      map.getCanvas().style.cursor = '';
      popup?.remove();
    }
  }

  function initializeAnalysis() {
    if (analysisInitialized) return;

    const threshold = Number(document.getElementById('height-threshold').value);
    registerMeasurementIcons();
    map.addSource(groundHeightConfig.measurementSourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: createMeasurementFeatures() },
    });
    map.addLayer({
      id: groundHeightConfig.measurementLayerId,
      source: groundHeightConfig.measurementSourceId,
      type: 'symbol',
      filter: ['==', ['get', 'isReference'], false],
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
      filter: ['==', ['get', 'isReference'], false],
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
    refreshStatus();
    update();
    addPopupInteraction();
  }

  function bindUi() {
    document.getElementById('height-analysis-toggle').addEventListener('click', () => {
      if (!analysisVisible && !analysisInitialized) {
        try {
          initializeAnalysis();
        } catch (error) {
          showError(error);
          return;
        }
      }
      setAnalysisVisible(!analysisVisible);
    });
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

    document.getElementById('height-analysis-toggle').disabled = false;
    sampleCount = samples.length;
    refreshStatus();
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
          ? `<strong>${t('referencePoint')}</strong><br>${t('groundHeight', { height: Number(groundHeight).toFixed(2) })}`
          : `<strong>${escapeHtml(label)}</strong><br>${t('groundHeight', { height: Number(groundHeight).toFixed(2) })}<br>${t('localReference', { height: Number(csvReference).toFixed(2) })}<br>${t('difference', { height: (Number(heightDifference) * 100).toFixed(1) })}`;
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
    bindUi,
    load,
    refreshLanguage: refreshStatus,
    scheduleUpdate,
    showError,
  };
}
