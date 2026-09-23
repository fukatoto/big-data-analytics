import airfieldLightingImage from './assets/images/befeuerungsanlage.jpg';
import bunkerConceptImage from './assets/images/bunker_concept.jpg';
import bunkerImage from './assets/images/bunker.jpg';
import heideblickConceptImage from './assets/images/heideblick_concept.jpg';
import heideblickImage from './assets/images/heideblick.jpg';
import heideStegConceptImage from './assets/images/heidesteg.jpg';
import heidetribueneConceptImage from './assets/images/heidetribune.jpg';
import landscapeParkConceptImage from './assets/images/landschaftspark.jpg';
import northernRunwayImage from './assets/images/nord-landebahn.jpg';
import northernRunwayConceptImage from './assets/images/nord-landebahn_concept.jpg';
import radarPlateauImage from './assets/images/radarstation.jpg';
import rundbogenantenneConceptImage from './assets/images/rundbogenantenne_concept.jpg';
import rundbogenantenneImage from './assets/images/rundbogenantenne.jpg';
import runwayOaseConceptImage from './assets/images/landebahnoase.jpg';
import schumacherQuartierConceptImage from './assets/images/schumacher-quartier.jpg';
import southernRunwayConceptImage from './assets/images/sud-landebahn.jpg';
import sunbathingLawnConceptImage from './assets/images/liegewiese.jpg';
import futureTreenurnurseryConceptImage from './assets/images/baumschule.jpg';
import landscapeMaintenanceHubImage from './assets/images/landschaftspflegehof.jpg';
import grazingZoneSkudde from './assets/images/beweidungszone_skudde.jpg';
import grazingZoneSheep from './assets/images/beweidungszone_fuchsschaf.jpg';
import grazingZoneCow from './assets/images/beweidungszone_hohenvieh.jpg';
import grazingZoneHorse from './assets/images/beweidungszone_pferde.jpg';
import terminalAConceptImage from './assets/images/terminal_a_concept.png';
import terminalARealImage from './assets/images/terminal_a_real.jpg';
import terminalBConceptImage from './assets/images/terminal_b_concept_new.png';
import terminalBRealImage from './assets/images/terminal_b_real.jpg';
import terminalDConceptInteriorImage from './assets/images/terminal_d_concept_interior.png';
import terminalDConceptImage from './assets/images/terminal_d_concept.png';
import terminalDRealInteriorImage from './assets/images/terminal_d_real_interior.jpg';
import terminalDRealImage from './assets/images/terminal_d_real.jpg';

export const projectAreasDataUrl = '/data/txl-project-areas.geojson';

// Coordinate-based places can use `images` for a small popup gallery or `image`
// for a single visual. Gallery entries are ordered from the current view to the
// future concept.
export const places = {
  'terminal-a': {
    name: 'Terminal A',
    number: '04 / 23',
    coordinates: [13.2889469, 52.5544223],
    images: [
      {
        src: terminalARealImage,
        labelKey: 'currentImage',
        credit: 'Christian Sommer',
      },
      {
        src: terminalAConceptImage,
        labelKey: 'conceptImage',
        credit: 'agn Niederberghaus & Partner',
      },
    ],
    descriptionKey: 'terminalADescription',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/',
  },
  'terminal-b': {
    name: 'Terminal B',
    number: '05 / 23',
    coordinates: [13.2920506, 52.5541399],
    images: [
      {
        src: terminalBRealImage,
        labelKey: 'currentImage',
        credit: 'Gerhard Kassner',
      },
      {
        src: terminalBConceptImage,
        labelKey: 'conceptImage',
        credit: 'Chaix & Morel et Associés',
      },
    ],
    descriptionKey: 'terminalBDescription',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/',
  },
  'terminal-d': {
    name: 'Terminal D',
    number: '06 / 23',
    coordinates: [13.291662, 52.5523579],
    images: [
      {
        src: terminalDRealImage,
        labelKey: 'currentImage',
        credit: 'Berlin TXL Management GmbH',
      },
      {
        src: terminalDConceptImage,
        labelKey: 'conceptImage',
        credit: 'GRAFT',
      },
      {
        src: terminalDRealInteriorImage,
        labelKey: 'currentInteriorImage',
        credit: 'Berlin TXL Management GmbH',
      },
      {
        src: terminalDConceptInteriorImage,
        labelKey: 'conceptInteriorImage',
        credit: 'GRAFT',
      },
    ],
    descriptionKey: 'terminalDDescription',
    source: 'https://urbantechrepublic.de/en/faq/',
  },
  'urban-tech-republic': {
    nameKey: 'urbanTechRepublic',
    number: '02 / 23',
    bounds: [
      [13.27488489, 52.54882258],
      [13.31020587, 52.56154831],
    ],
    descriptionKey: 'urbanTechRepublicDescription',
    projectAreaId: 'urban-tech-republic',
  },
  'schumacher-quartier': {
    nameKey: 'schumacherQuartier',
    number: '03 / 23',
    bounds: [
      [13.31067033, 52.55888093],
      [13.32751649, 52.56537308],
    ],
    descriptionKey: 'schumacherQuartierDescription',
    projectAreaId: 'schumacher-quartier',
  },
  'tegeler-stadtheide': {
    nameKey: 'tegelerStadtheide',
    number: '01 / 23',
    bounds: [
      [13.25635322, 52.55243287],
      [13.30305156, 52.56572367],
    ],
    descriptionKey: 'tegelerStadtheideDescription',
    projectAreaId: 'tegeler-stadtheide',
  },
  heideblick: {
    nameKey: 'heideblick',
    number: '07 / 23',
    coordinates: [13.265539352308727, 52.56025064158781],
    images: [
      {
        src: heideblickImage,
        labelKey: 'currentImage',
        credit: 'Thomas Rosenthal',
      },
      {
        src: heideblickConceptImage,
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl',
      },
    ],
    descriptionKey: 'heideblickDescription',
    source:
      'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt',
  },
  bunker: {
    nameKey: 'recreation',
    number: '08 / 23',
    coordinates: [13.25783266632616, 52.55416615425812],
    images: [
      {
        src: bunkerImage,
        labelKey: 'currentImage',
        credit: 'Alexander Gottwald',
      },
      {
        src: bunkerConceptImage,
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl',
      },
    ],
    descriptionKey: 'recreationDescription',
    source:
      'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt',
  },
  rundbogenantenne: {
    nameKey: 'archedAntenna',
    number: '09 / 23',
    coordinates: [13.287565760368738, 52.56150630401666],
    images: [
      {
        src: rundbogenantenneImage,
        labelKey: 'currentImage',
        credit: 'Thomas Rosenthal',
      },
      {
        src: rundbogenantenneConceptImage,
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl',
      },
    ],
    descriptionKey: 'archedAntennaDescription',
    source:
      'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt',
  },
  zelt: {
    nameKey: 'tent',
    number: '10 / 23',
    coordinates: [13.27559195542228, 52.55301043217409],
    descriptionKey: 'tentDescription',
  },
  'northern-runway': {
    nameKey: 'northernRunway',
    number: '11 / 23',
    coordinates: [13.27325037503029, 52.55832749635448], //,
    images: [
      {
        src: northernRunwayImage,
        labelKey: 'currentImage',
        credit: 'Yann-Cédric Gagern',
      },
      {
        src: northernRunwayConceptImage,
        labelKey: 'conceptImage',
        credit: 'Thomas Rosenthal',
      },
    ],
    descriptionKey: 'northernRunwayDescription',
  },
  'southern-runway': {
    nameKey: 'southernRunway',
    number: '12 / 23',
    coordinates: [13.295831615387536, 52.558694994641904],
    images: [
      {
        src: southernRunwayConceptImage,
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl',
      },
    ],
    descriptionKey: 'southernRunwayDescription',
  },
  'airfield-lighting': {
    nameKey: 'airfieldLighting',
    number: '13 / 23',
    coordinates: [13.260998045156224, 52.557178333184616],
    images: [
      {
        src: airfieldLightingImage,
        labelKey: 'currentImage',
        credit: 'Thomas Rosenthal',
      },
    ],
    descriptionKey: 'airfieldLightingDescription',
  },
  'landscape-park': {
    nameKey: 'landscapePark',
    number: '14 / 23',
    coordinates: [13.3054988885774, 52.56307055794183],
    images: [
      {
        src: landscapeParkConceptImage,
        labelKey: 'conceptImage',
        credit: 'GM013 Landschaftsarchitektur',
      },
    ],
    descriptionKey: 'landscapeParkDescription',
  },
  'schumacher-quartier-place': {
    nameKey: 'schumacherQuartier',
    number: '15 / 23',
    coordinates: [13.314237018067079, 52.560911421590774],
    images: [
      {
        src: schumacherQuartierConceptImage,
        labelKey: 'conceptImage',
        credit: 'Berlin TXL Management GmbH',
      },
    ],
    descriptionKey: 'schumacherQuartierDescription',
  },
  'sunbathing-lawn': {
    nameKey: 'sunbathingLawn',
    number: '16 / 23',
    coordinates: [13.267099307246742, 52.55834173147002],
    images: [
      {
        src: sunbathingLawnConceptImage,
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl',
      },
    ],
    descriptionKey: 'sunbathingLawnDescription',
  },
  'future-tree-nursery': {
    nameKey: 'futureTreeNursery',
    number: '17 / 23',
    coordinates: [13.274756493743066, 52.55403370802851],
    images: [
      {
        src: futureTreenurnurseryConceptImage,
        labelKey: 'currentImage',
        credit: 'BAUFACHFRAU Berlin e.V.',
      },
    ],
    descriptionKey: 'futureTreeNurseryDescription',
  },
  'radar-plateau': {
    nameKey: 'radarPlateau',
    number: '18 / 23',
    coordinates: [13.280517944905284, 52.56344500035554],
    images: [
      {
        src: radarPlateauImage,
        labelKey: 'currentImage',
        credit: 'Matti Blume',
      },
    ],
    descriptionKey: 'radarPlateauDescription',
  },
  'landscape-maintenance-hub': {
    nameKey: 'landscapeMaintenanceHub',
    number: '19 / 23',
    coordinates: [13.2753790741931632, 52.55445443953052],
    images: [
      {
        src: landscapeMaintenanceHubImage,
        labelKey: 'currentImage',
        credit: 'Grün Berlin GmbH',
      },
    ],
    descriptionKey: 'landscapeMaintenanceHubDescription',
  },
  'grazing-zone': {
    nameKey: 'grazingZone',
    number: '20 / 23',
    coordinates: [13.28397881028478, 52.56091067585946],
    images: [
      {
        src: grazingZoneSkudde,
        labelKey: 'currentImage',
        credit: 'Stefan Klenke',
      },
      {
        src: grazingZoneSheep,
        labelKey: 'currentImage',
        credit: 'Stefan Klenke',
      },
      {
        src: grazingZoneCow,
        labelKey: 'currentImage',
        credit: 'Dronebrothers',
      },
      {
        src: grazingZoneHorse,
        labelKey: 'currentImage',
        credit: 'Dronebrothers',
      },
    ],
    descriptionKey: 'grazingZoneDescription',
  },
  'heide-steg': {
    nameKey: 'heideSteg',
    number: '21 / 23',
    coordinates: [13.263043641473889, 52.55741286479246],
    images: [
      {
        src: heideStegConceptImage,
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl',
      },
    ],
    descriptionKey: 'heideStegDescription',
  },
  'heide-tribuene': {
    nameKey: 'heidetribuene',
    number: '22 / 23',
    coordinates: [13.26765498094581, 52.56043885266264],
    images: [
      {
        src: heidetribueneConceptImage,
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl',
      },
    ],
    descriptionKey: 'heidetribueneDescription',
  },
  'runway-oase': {
    nameKey: 'runwayOase',
    number: '23 / 23',
    coordinates: [13.283032631067696, 52.55931600598261],
    images: [
      {
        src: runwayOaseConceptImage,
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl',
      },
    ],
    descriptionKey: 'runwayOaseDescription',
  },
};

export const campusCamera = {
  center: [13.2904, 52.554],
  zoom: 15.95,
  pitch: 58,
  bearing: -24,
};

export const airportBounds = [
  [13.2559, 52.5481],
  [13.3285, 52.5686],
];

// Keeps panning local while leaving enough surrounding map for the wide airport
// footprint to fit into narrow and portrait viewports.
export const airportNavigationBounds = [
  [13.242, 52.524],
  [13.342, 52.594],
];

export const airportViewPadding = () => (window.innerWidth < 700 ? 32 : 72);

export const satelliteBasemapConfig = {
  sourceId: 'berlin-true-orthophotos',
  layerId: 'berlin-true-orthophotos-raster',
  tiles: [
    'https://gdi.berlin.de/services/wms/truedop_2025_sommer?service=WMS&version=1.1.1&request=GetMap&layers=truedop_2025_sommer_rgb&styles=&format=image/jpeg&transparent=false&srs=EPSG:3857&width=512&height=512&bbox={bbox-epsg-3857}',
  ],
  tileSize: 512,
  attribution:
    'Aerial view: Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen Berlin · Data as of Sommer 2025 · dl-de-zero-2.0',
};

export const groundHeightConfig = {
  csvUrl: '/data/txl-ground-heights.csv',
  boundaryUrl: '/data/txl-project-boundary.geojson',
  annotations: [
    {
      label: 'Alex',
      kind: 'person',
      coordinates: [13.259251617531516, 52.555446290177834],
    },
    {
      label: 'Yann',
      kind: 'person',
      coordinates: [13.275141666666667, 52.55308055555556],
    },
    {
      label: 'Finn',
      kind: 'person',
      coordinates: [13.266351973650105, 52.55777387164781],
    },
    {
      label: 'Julius',
      kind: 'person',
      coordinates: [13.262232793634189, 52.55461090738936],
    },
  ],
  measurementSourceId: 'txl-ground-height-measurements',
  boundarySourceId: 'txl-project-boundary',
  measurementLayerId: 'txl-ground-height-measurement-icons',
  referenceLayerId: 'txl-ground-height-reference-point',
  measurementLabelLayerId: 'txl-ground-height-measurement-labels',
  boundaryLayerId: 'txl-project-boundary',
  beforeLayerId: 'txl-3d-buildings',
  colors: {
    obstacle: '#dd4444',
    clear: '#35a66f',
    reference: '#2563eb',
    boundary: '#000000',
  },
};

export const projectAreas = {
  'urban-tech-republic': {
    sourceName: 'Urban Tech Republic',
    labelKey: 'urbanTechRepublic',
    color: '#a61be1',
  },
  'schumacher-quartier': {
    sourceName: 'Schumacher Quartier',
    labelKey: 'schumacherQuartier',
    color: '#c82121',
  },
  'tegeler-stadtheide': {
    sourceName: 'Landschaftsraum',
    labelKey: 'tegelerStadtheide',
    color: '#166cb8',
  },
};

export const projectAreaConfig = {
  sourceId: 'txl-project-areas',
  sourceUrl: projectAreasDataUrl,
  fillLayerId: 'txl-project-areas-fill',
  outlineLayerId: 'txl-project-areas-outline',
  labelLayerId: 'txl-project-areas-label',
  beforeLayerId: 'txl-3d-buildings',
};
