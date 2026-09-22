import * as maplibregl from 'maplibre-gl';
import { groundHeightConfig } from './config.js';
import { createGroundHeightFeatures, parseGroundHeightCsv } from './ground-height-analysis.js';

export function createGroundHeightOverlay({ map, t, createTranslatedError }) {
  const updateDelay = 200;
  let features = [];
  let sampleCount = 0;
  let loadError = null;
  let gridVisible = false;
  let popup = null;
  let updateTimer = null;

  function colorExpression(threshold) {
    return [
      'case',
      ['boolean', ['get', 'calculated'], false],
      [
        'case',
        ['>=', ['get', 'heightDifference'], threshold],
        groundHeightConfig.colors.obstacle,
        groundHeightConfig.colors.clear,
      ],
      groundHeightConfig.colors.grid,
    ];
  }

  function formatThreshold(threshold) {
    return `${Math.round(threshold * 100)} cm`;
  }

  function refreshStatus() {
    const status = document.getElementById('height-data-status');
    if (loadError) {
      status.textContent = loadError.translationKey
        ? t(loadError.translationKey, loadError.translationVariables)
        : loadError.message;
    } else if (sampleCount) {
      const analysedCells = features.filter(
        (feature) => feature.properties.calculated,
      ).length;
      status.textContent = t('dataStatus', {
        points: sampleCount,
        cells: analysedCells,
        gridCells: features.length,
      });
    } else {
      status.textContent = t('loadingHeightData');
    }
  }

  function update() {
    const threshold = Number(document.getElementById('height-threshold').value);
    document.getElementById('height-threshold-value').textContent = formatThreshold(threshold);

    if (map.getLayer(groundHeightConfig.fillLayerId)) {
      const color = colorExpression(threshold);
      map.setPaintProperty(groundHeightConfig.fillLayerId, 'fill-color', color);
      map.setPaintProperty(groundHeightConfig.cellOutlineLayerId, 'line-color', color);
    }

    const analysedFeatures = features.filter(
      (feature) => feature.properties.calculated,
    );
    const obstacles = analysedFeatures.filter(
      (feature) => feature.properties.heightDifference >= threshold,
    ).length;
    document.getElementById('obstacle-count').textContent = String(obstacles);
    document.getElementById('clear-count').textContent = String(
      analysedFeatures.length - obstacles,
    );
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

  function setGridVisible(visible) {
    gridVisible = visible;
    const button = document.getElementById('height-grid-toggle');
    button.classList.toggle('is-active', gridVisible);
    button.setAttribute('aria-checked', String(gridVisible));

    [groundHeightConfig.fillLayerId, groundHeightConfig.cellOutlineLayerId].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', gridVisible ? 'visible' : 'none');
      }
    });

    if (!gridVisible) {
      map.getCanvas().style.cursor = '';
      popup?.remove();
    }
  }

  function bindUi() {
    document.getElementById('height-grid-toggle').addEventListener('click', () => {
      setGridVisible(!gridVisible);
    });
  }

  function showError(error) {
    loadError = error;
    document.querySelector('.height-control').classList.add('is-error');
    refreshStatus();
  }

  async function load() {
    const [heightResponse, boundaryResponse, analysisAreaResponse] = await Promise.all([
      fetch(groundHeightConfig.csvUrl),
      fetch(groundHeightConfig.boundaryUrl),
      fetch(groundHeightConfig.analysisAreaUrl),
    ]);
    if (!heightResponse.ok) {
      throw createTranslatedError('heightCsvLoadError', { status: heightResponse.status });
    }
    if (!boundaryResponse.ok) {
      throw createTranslatedError('boundaryLoadError', { status: boundaryResponse.status });
    }
    if (!analysisAreaResponse.ok) {
      throw createTranslatedError('analysisAreaLoadError', {
        status: analysisAreaResponse.status,
      });
    }

    const samples = parseGroundHeightCsv(await heightResponse.text(), createTranslatedError);
    const boundaryData = await boundaryResponse.json();
    const analysisAreaData = await analysisAreaResponse.json();
    const boundaryFeature = boundaryData.features?.[0];
    if (boundaryFeature?.geometry?.type !== 'Polygon') {
      throw createTranslatedError('boundaryFormatError');
    }
    const analysisAreaGeometry = analysisAreaData.features?.find(
      (feature) =>
        feature.properties?.[groundHeightConfig.analysisAreaProperty] ===
        groundHeightConfig.analysisAreaValue,
    )?.geometry;
    if (!['Polygon', 'MultiPolygon'].includes(analysisAreaGeometry?.type)) {
      throw createTranslatedError('analysisAreaFormatError');
    }

    const result = createGroundHeightFeatures(
      samples,
      boundaryFeature.geometry.coordinates[0],
      analysisAreaGeometry,
      groundHeightConfig.cellSizeMeters,
    );
    if (result.analysisSampleCount < 2) {
      throw createTranslatedError('analysisAreaHeightMinimum');
    }
    features = result.features;
    const threshold = Number(document.getElementById('height-threshold').value);

    map.addSource(groundHeightConfig.boundarySourceId, { type: 'geojson', data: boundaryData });
    map.addSource(groundHeightConfig.sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features }
    });
    map.addLayer({
      id: groundHeightConfig.fillLayerId,
      source: groundHeightConfig.sourceId,
      type: 'fill',
      layout: {
        visibility: gridVisible ? 'visible' : 'none'
      },
      paint: {
        'fill-color': colorExpression(threshold),
        'fill-opacity': [
          'case',
          ['boolean', ['get', 'calculated'], false],
          0.34,
          0.06,
        ],
      }
    }, groundHeightConfig.beforeLayerId);
    map.addLayer({
      id: groundHeightConfig.cellOutlineLayerId,
      source: groundHeightConfig.sourceId,
      type: 'line',
      layout: {
        visibility: gridVisible ? 'visible' : 'none'
      },
      paint: {
        'line-color': colorExpression(threshold),
        'line-opacity': [
          'case',
          ['boolean', ['get', 'calculated'], false],
          0.25,
          0.48,
        ],
        'line-width': 0.45
      }
    }, groundHeightConfig.beforeLayerId);
    map.addLayer({
      id: groundHeightConfig.boundaryLayerId,
      source: groundHeightConfig.boundarySourceId,
      type: 'line',
      paint: {
        'line-color': groundHeightConfig.colors.boundary,
        'line-opacity': 0.9,
        'line-width': 2
      }
    }, groundHeightConfig.beforeLayerId);

    document.getElementById('height-threshold').disabled = false;
    document.getElementById('height-grid-toggle').disabled = false;
    sampleCount = samples.length;
    refreshStatus();
    update();
    addPopupInteraction();
  }

  function addPopupInteraction() {
    popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });
    map.on('mousemove', groundHeightConfig.fillLayerId, (event) => {
      const feature = event.features?.[0];
      if (!feature?.properties?.calculated) {
        map.getCanvas().style.cursor = '';
        popup.remove();
        return;
      }
      map.getCanvas().style.cursor = 'pointer';
      const { groundHeight, referenceHeight, heightDifference } = feature.properties;
      popup
        .setLngLat(event.lngLat)
        .setHTML(`<strong>${t('groundHeight', { height: Number(groundHeight).toFixed(2) })}</strong><br>${t('localReference', { height: Number(referenceHeight).toFixed(2) })}<br>${t('difference', { height: (Number(heightDifference) * 100).toFixed(1) })}`)
        .addTo(map);
    });
    map.on('mouseleave', groundHeightConfig.fillLayerId, () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });
  }

  return {
    bindUi,
    load,
    refreshLanguage: refreshStatus,
    scheduleUpdate,
    showError,
  };
}
