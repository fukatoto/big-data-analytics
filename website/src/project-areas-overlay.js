import { projectAreaConfig, projectAreas } from './config.js';

export function createProjectAreasOverlay({ map, t }) {
  const activeAreas = new Set(['tegeler-stadtheide']);
  let fillVisible = false;
  const layerIds = [
    projectAreaConfig.fillLayerId,
    projectAreaConfig.outlineLayerId,
    projectAreaConfig.labelLayerId
  ];

  function activeFilter() {
    const sourceNames = [...activeAreas].map((id) => projectAreas[id].sourceName);
    return ['in', ['get', 'teilraum'], ['literal', sourceNames]];
  }

  function colorExpression() {
    return [
      'match',
      ['get', 'teilraum'],
      ...Object.values(projectAreas).flatMap((area) => [area.sourceName, area.color]),
      '#6f7f79'
    ];
  }

  function labelExpression() {
    return [
      'match',
      ['get', 'teilraum'],
      ...Object.values(projectAreas).flatMap((area) => [area.sourceName, t(area.labelKey)]),
      ['get', 'teilraum']
    ];
  }

  function updateFilters() {
    const filter = activeFilter();
    layerIds.forEach((layerId) => {
      if (map.getLayer(layerId)) map.setFilter(layerId, filter);
    });
  }

  function toggleArea(id) {
    if (!projectAreas[id]) return;
    if (activeAreas.has(id)) {
      activeAreas.delete(id);
    } else {
      activeAreas.add(id);
    }

    const button = document.querySelector(`[data-project-area="${id}"]`);
    const active = activeAreas.has(id);
    button?.classList.toggle('is-active', active);
    button?.setAttribute('aria-pressed', String(active));
    updateFilters();
  }

  function showArea(id) {
    if (!projectAreas[id]) return;
    activeAreas.add(id);
    const button = document.querySelector(`[data-project-area="${id}"]`);
    button?.classList.add('is-active');
    button?.setAttribute('aria-pressed', 'true');
    updateFilters();
  }

  function setAllAreasVisible(visible) {
    activeAreas.clear();
    if (visible) {
      Object.keys(projectAreas).forEach((id) => activeAreas.add(id));
    }
    document.querySelectorAll('[data-project-area]').forEach((button) => {
      const active = activeAreas.has(button.dataset.projectArea);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateFilters();
  }

  function toggleFill() {
    fillVisible = !fillVisible;
    const button = document.getElementById('project-area-fill-toggle');
    button?.classList.toggle('is-active', fillVisible);
    button?.setAttribute('aria-pressed', String(fillVisible));
    if (map.getLayer(projectAreaConfig.fillLayerId)) {
      map.setLayoutProperty(
        projectAreaConfig.fillLayerId,
        'visibility',
        fillVisible ? 'visible' : 'none'
      );
    }
  }

  function bindUi() {
    document.querySelectorAll('[data-project-area]').forEach((button) => {
      button.addEventListener('click', () => toggleArea(button.dataset.projectArea));
    });
    document.getElementById('project-area-fill-toggle').addEventListener('click', toggleFill);
    document.getElementById('show-all-project-areas').addEventListener('click', () => {
      setAllAreasVisible(true);
    });
    document.getElementById('hide-all-project-areas').addEventListener('click', () => {
      setAllAreasVisible(false);
    });
  }

  function addLayers() {
    map.addSource(projectAreaConfig.sourceId, {
      type: 'geojson',
      data: projectAreaConfig.sourceUrl,
      attribution: 'Tegel Projekt GmbH / Berlin TXL · CC BY 4.0'
    });

    map.addLayer({
      id: projectAreaConfig.fillLayerId,
      source: projectAreaConfig.sourceId,
      type: 'fill',
      filter: activeFilter(),
      layout: {
        visibility: fillVisible ? 'visible' : 'none'
      },
      paint: {
        'fill-color': colorExpression(),
        'fill-opacity': 0.25
      }
    }, projectAreaConfig.beforeLayerId);

    const firstLabelLayer = map.getStyle().layers.find(
      (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    map.addLayer({
      id: projectAreaConfig.outlineLayerId,
      source: projectAreaConfig.sourceId,
      type: 'line',
      filter: activeFilter(),
      paint: {
        'line-color': colorExpression(),
        'line-opacity': 0.95,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 16, 3]
      }
    }, firstLabelLayer);

    map.addLayer({
      id: projectAreaConfig.labelLayerId,
      source: projectAreaConfig.sourceId,
      type: 'symbol',
      filter: activeFilter(),
      layout: {
        'text-field': labelExpression(),
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 16, 13],
        'text-max-width': 14,
        'text-letter-spacing': 0.04,
        'text-allow-overlap': false
      },
      paint: {
        'text-color': '#18332e',
        'text-halo-color': 'rgba(255,255,249,0.95)',
        'text-halo-width': 2
      }
    }, firstLabelLayer);
  }

  function refreshLanguage() {
    if (map.getLayer(projectAreaConfig.labelLayerId)) {
      map.setLayoutProperty(projectAreaConfig.labelLayerId, 'text-field', labelExpression());
    }
  }

  return { addLayers, bindUi, refreshLanguage, showArea };
}
