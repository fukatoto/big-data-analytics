import { satelliteBasemapConfig } from './config.js';

export function createBasemapController({ map }) {
  let satelliteVisible = false;

  function setSatelliteVisible(visible) {
    satelliteVisible = visible;
    if (map.getLayer(satelliteBasemapConfig.layerId)) {
      map.setLayoutProperty(
        satelliteBasemapConfig.layerId,
        'visibility',
        visible ? 'visible' : 'none',
      );
    }
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
    setSatelliteVisible,
  };
}
