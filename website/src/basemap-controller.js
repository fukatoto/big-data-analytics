import { satelliteBasemapConfig } from './config.js';

export function createBasemapController({ map, t }) {
  let satelliteVisible = false;

  function updateButton() {
    const button = document.getElementById('satellite-toggle');
    button.classList.toggle('is-active', satelliteVisible);
    button.setAttribute('aria-pressed', String(satelliteVisible));
    button.setAttribute('title', t('satelliteView'));
  }

  function setSatelliteVisible(visible) {
    satelliteVisible = visible;
    if (map.getLayer(satelliteBasemapConfig.layerId)) {
      map.setLayoutProperty(
        satelliteBasemapConfig.layerId,
        'visibility',
        visible ? 'visible' : 'none',
      );
    }
    updateButton();
  }

  function bindUi() {
    document
      .getElementById('satellite-toggle')
      .addEventListener('click', () => setSatelliteVisible(!satelliteVisible));
    updateButton();
  }

  function addLayer() {
    map.addSource(satelliteBasemapConfig.sourceId, {
      type: 'raster',
      tiles: satelliteBasemapConfig.tiles,
      tileSize: satelliteBasemapConfig.tileSize,
      attribution: satelliteBasemapConfig.attribution,
    });

    const firstLabelLayer = map
      .getStyle()
      .layers.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field'],
      )?.id;

    map.addLayer(
      {
        id: satelliteBasemapConfig.layerId,
        source: satelliteBasemapConfig.sourceId,
        type: 'raster',
        layout: {
          visibility: satelliteVisible ? 'visible' : 'none',
        },
        paint: {
          'raster-fade-duration': 180,
        },
      },
      firstLabelLayer,
    );
  }

  return {
    addLayer,
    bindUi,
    refreshLanguage: updateButton,
  };
}
