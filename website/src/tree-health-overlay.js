import * as maplibregl from 'maplibre-gl';
import { formatDecimal } from './number-format.js';

export function createTreeHealthOverlay({ map, t, filters }) {
  const treePopups = new Map();
  let treeHoverPopup = null;
  let treeHealthVisible = false;
  let treeFeatures = null;
  let treeBounds = null;
  const treeFilters = filters;
  function closeTreePopups() {
    for (const popup of treePopups.values()) popup.remove();
    treePopups.clear();
  }

  async function addTrees() {
    const beforeLayerId = 'txl-3d-buildings';
    const visibility = treeHealthVisible ? 'visible' : 'none';
    const response = await fetch('/data/baeume.geojson');
    if (!response.ok) throw new Error(`Tree data could not be loaded (${response.status}).`);
    const treeData = await response.json();
    treeBounds = new maplibregl.LngLatBounds();
    treeData.features.forEach((feature) => {
      feature.geometry.coordinates.forEach((ring) => {
        ring.forEach((coordinate) => treeBounds.extend(coordinate));
      });
    });
    const heights = treeData.features
      .map((feature) => feature.properties?.hoehe_m)
      .filter((height) => typeof height === 'number' && Number.isFinite(height));
    if (!heights.length) throw new Error('Tree data does not contain valid heights.');
    const minimumHeight = Math.floor(Math.min(...heights) * 10) / 10;
    const maximumHeight = Math.ceil(Math.max(...heights) * 10) / 10;
    treeFilters.minimumHeight = minimumHeight;
    treeFilters.maximumHeight = maximumHeight;
    treeFilters.heightValues.minimum = minimumHeight;
    treeFilters.heightValues.maximum = maximumHeight;
    const crownDiameters = treeData.features
      .map((feature) => feature.properties?.durchm_m)
      .filter((diameter) => typeof diameter === 'number' && Number.isFinite(diameter));
    if (!crownDiameters.length) throw new Error('Tree data does not contain valid crown diameters.');
    const minimumCrownDiameter = Math.floor(Math.min(...crownDiameters) * 10) / 10;
    const maximumCrownDiameter = Math.ceil(Math.max(...crownDiameters) * 10) / 10;
    treeFilters.minimumCrownDiameter = minimumCrownDiameter;
    treeFilters.maximumCrownDiameter = maximumCrownDiameter;
    treeFilters.crownValues.minimum = minimumCrownDiameter;
    treeFilters.crownValues.maximum = maximumCrownDiameter;
    treeFeatures = treeData.features;
    treeFilters.totalCount = treeFeatures.length;
    const treeColor = [
      'case',
      ['==', ['typeof', ['get', 'z']], 'number'],
      [
        'interpolate', ['linear'], ['get', 'z'],
        -3,   '#a50026',  // deutlich weniger grün: dunkelrot
        -2,   '#e8603c',  // Grenze "auffällig": orange-rot
        -1,   '#d4c45a',  // leicht unterdurchschnittlich: gedecktes Gelb
        -0.5, '#8cc063',
        0,    '#4a9e4a',  // typischer Baum: grün
        1.5,  '#1e6b35',  // überdurchschnittlich grün: dunkelgrün
      ],
      '#9e9e9e',          // kein Wert messbar: grau
    ];

    map.addSource('baeume', {
      type: 'geojson',
      data: treeData,
    });

    map.addLayer({
      id: 'baeume-fill',
      type: 'fill',
      source: 'baeume',
      minzoom: 15,
      layout: { visibility },
      paint: {
        'fill-color': treeColor,
        'fill-opacity': 0.55,
      },
    }, beforeLayerId);

    map.addLayer({
      id: 'baeume-outline',
      type: 'line',
      source: 'baeume',
      minzoom: 15,
      layout: { visibility },
      paint: {
        'line-color': treeColor,
        'line-width': 0.8,
      },
    }, beforeLayerId);

    map.addLayer({
      id: 'baeume-auffaellig',
      type: 'line',
      source: 'baeume',
      minzoom: 15,
      layout: { visibility },
      filter: ['to-boolean', ['get', 'auffaellig']],
      paint: {
        'line-color': '#d00000',
        'line-width': 2.5,
      },
    }, beforeLayerId);

    function treePopupContent(p) {
      const gcc = Number(p.gcc);
      const greenShare = p.gcc == null || !Number.isFinite(gcc)
        ? '–'
        : `${formatDecimal(gcc * 100, 1)} %`;
      const lines = [
        `<strong>${t('treeTitle', { id: p.id })}</strong>`,
        t('treeHeight', { height: formatDecimal(Number(p.hoehe_m), 1) }),
        t('treeCrownDiameter', { diameter: formatDecimal(Number(p.durchm_m), 1) }),
        t('treeGreenness', { value: greenShare }),
      ];
      if (p.auffaellig) {
        lines.push(`<strong style="color:#d00000">${t('treeConspicuous')}</strong>`);
      }
      return `<div class="place-popup-body">${lines.join('<br>')}</div>`;
    }

    treeHoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'ground-height-map-popup tree-hover-popup',
      offset: 10,
    });
    let hoveredTreeId = null;

    map.on('mousemove', 'baeume-fill', (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      if (treePopups.has(feature.properties.id)) {
        treeHoverPopup.remove();
        hoveredTreeId = null;
        return;
      }
      if (hoveredTreeId !== feature.properties.id || !treeHoverPopup.isOpen()) {
        treeHoverPopup.setHTML(treePopupContent(feature.properties));
        hoveredTreeId = feature.properties.id;
      }
      treeHoverPopup.setLngLat(event.lngLat);
      if (!treeHoverPopup.isOpen()) treeHoverPopup.addTo(map);
    });

    map.on('click', 'baeume-fill', (event) => {
      const feature = event.features?.[0];
      if (!feature) return;
      treeHoverPopup.remove();
      hoveredTreeId = null;
      const treeId = feature.properties.id;
      const existingPopup = treePopups.get(treeId);
      if (existingPopup) {
        existingPopup.setLngLat(event.lngLat);
        return;
      }
      const popup = new maplibregl.Popup({
        className: 'ground-height-map-popup tree-map-popup',
        closeOnClick: false,
        offset: 10,
      })
        .setLngLat(event.lngLat)
        .setHTML(treePopupContent(feature.properties))
        .addTo(map);
      treePopups.set(treeId, popup);
      popup.on('close', () => {
        if (treePopups.get(treeId) === popup) treePopups.delete(treeId);
      });
    });

    map.on('mouseenter', 'baeume-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'baeume-fill', () => {
      map.getCanvas().style.cursor = '';
      treeHoverPopup.remove();
      hoveredTreeId = null;
    });
    setTreeFilters();
  }

  function setTreeHealthVisible(visible) {
    if (treeHealthVisible === visible) return;
    treeHealthVisible = visible;
    const panel = document.querySelector('.tree-health-control');
    panel.hidden = !visible;
    if (visible) {
      panel.classList.remove('is-desktop-collapsed');
      panel.querySelector('.desktop-panel-collapse').setAttribute('aria-expanded', 'true');
    }
    ['baeume-fill', 'baeume-outline', 'baeume-auffaellig'].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });
    if (!visible) {
      closeTreePopups();
      treeHoverPopup?.remove();
      map.getCanvas().style.cursor = '';
    }
  }

  function numericTreeValue(value) {
    if (value == null) return -1;
    const number = Number(value);
    return Number.isFinite(number) ? number : -1;
  }

  function setTreeFilters() {
    const conspicuousOnly = treeFilters.conspicuousOnly;
    const percent = treeFilters.greenValues[treeFilters.greenMode];
    const selectedHeight = treeFilters.heightValues[treeFilters.heightMode];
    const selectedCrownDiameter = treeFilters.crownValues[treeFilters.crownMode];
    const filters = [];
    const matches = [];
    if (conspicuousOnly) {
      filters.push(['to-boolean', ['get', 'auffaellig']]);
      matches.push((properties) => properties.auffaellig === true);
    }
    const greenShare = ['to-number', ['get', 'gcc'], -1];
    if (treeFilters.greenMode === 'minimum' && percent > 0) {
      filters.push(['>=', greenShare, percent / 100]);
      matches.push((properties) => numericTreeValue(properties.gcc) >= percent / 100);
    } else if (treeFilters.greenMode === 'maximum' && percent < 100) {
      filters.push(['all', ['>=', greenShare, 0], ['<=', greenShare, percent / 100]]);
      matches.push((properties) => {
        const value = numericTreeValue(properties.gcc);
        return value >= 0 && value <= percent / 100;
      });
    }
    if (treeFilters.minimumHeight !== null && treeFilters.heightMode === 'minimum' && selectedHeight > treeFilters.minimumHeight) {
      filters.push(['>=', ['to-number', ['get', 'hoehe_m'], -1], selectedHeight]);
      matches.push((properties) => numericTreeValue(properties.hoehe_m) >= selectedHeight);
    } else if (treeFilters.maximumHeight !== null && treeFilters.heightMode === 'maximum' && selectedHeight < treeFilters.maximumHeight) {
      filters.push(['<=', ['to-number', ['get', 'hoehe_m'], -1], selectedHeight]);
      matches.push((properties) => numericTreeValue(properties.hoehe_m) <= selectedHeight);
    }
    const crownDiameter = ['to-number', ['get', 'durchm_m'], -1];
    if (treeFilters.minimumCrownDiameter !== null && treeFilters.crownMode === 'minimum' && selectedCrownDiameter > treeFilters.minimumCrownDiameter) {
      filters.push(['>=', crownDiameter, selectedCrownDiameter]);
      matches.push((properties) => numericTreeValue(properties.durchm_m) >= selectedCrownDiameter);
    } else if (treeFilters.maximumCrownDiameter !== null && treeFilters.crownMode === 'maximum' && selectedCrownDiameter < treeFilters.maximumCrownDiameter) {
      filters.push(['all', ['>=', crownDiameter, 0], ['<=', crownDiameter, selectedCrownDiameter]]);
      matches.push((properties) => {
        const value = numericTreeValue(properties.durchm_m);
        return value >= 0 && value <= selectedCrownDiameter;
      });
    }
    const filter = filters.length ? ['all', ...filters] : null;
    ['baeume-fill', 'baeume-outline'].forEach((layerId) => {
      if (map.getLayer(layerId)) map.setFilter(layerId, filter);
    });
    if (map.getLayer('baeume-auffaellig')) {
      const conspicuousFilter = ['to-boolean', ['get', 'auffaellig']];
      map.setFilter('baeume-auffaellig', filter
        ? ['all', conspicuousFilter, filter]
        : conspicuousFilter);
    }
    if (treeFeatures) {
      treeFilters.visibleCount = treeFeatures.filter((feature) =>
        matches.every((matchesFilter) => matchesFilter(feature.properties ?? {}))).length;
    }
    closeTreePopups();
    treeHoverPopup?.remove();
  }

  return { addTrees, getBounds: () => treeBounds, setTreeHealthVisible, setTreeFilters };
}
