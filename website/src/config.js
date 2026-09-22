export const projectAreasDataUrl = '/data/txl-project-areas.geojson';

// Coordinate-based places can use `images` for a small popup gallery or `image`
// for a single visual. Gallery entries are ordered from the current view to the
// future concept.
export const places = {
  'terminal-a': {
    name: 'Terminal A',
    number: '04 / 20',
    coordinates: [13.2889469, 52.5544223],
    images: [
      {
        src: '/images/terminal_a_real.png',
        labelKey: 'currentImage',
        credit: 'Christian Sommer'
      },
      {
        src: '/images/terminal_a_concept.png',
        labelKey: 'conceptImage',
        credit: 'agn Niederberghaus & Partner'
      }
    ],
    descriptionKey: 'terminalADescription',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/'
  },
  'terminal-b': {
    name: 'Terminal B',
    number: '05 / 20',
    coordinates: [13.2920506, 52.5541399],
    images: [
      {
        src: '/images/terminal_b_real.png',
        labelKey: 'currentImage',
        credit: 'Gerhard Kassner'
      },
      {
        src: '/images/terminal_b_concept_new.png',
        labelKey: 'conceptImage',
        credit: 'Chaix & Morel et Associés'
      }
    ],
    descriptionKey: 'terminalBDescription',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/'
  },
  'terminal-d': {
    name: 'Terminal D',
    number: '06 / 20',
    coordinates: [13.2916620, 52.5523579],
    images: [
      {
        src: '/images/terminal_d_real.jpg',
        labelKey: 'currentImage',
        credit: 'Berlin TXL Management GmbH'
      },
      {
        src: '/images/terminal_d_concept.png',
        labelKey: 'conceptImage',
        credit: 'GRAFT'
      },
      {
        src: '/images/terminal_d_real_interior.jpg',
        labelKey: 'currentInteriorImage',
        credit: 'Berlin TXL Management GmbH'
      },
      {
        src: '/images/terminal_d_concept_interior.png',
        labelKey: 'conceptInteriorImage',
        credit: 'GRAFT'
      }
    ],
    descriptionKey: 'terminalDDescription',
    source: 'https://urbantechrepublic.de/en/faq/'
  },
  'urban-tech-republic': {
    nameKey: 'urbanTechRepublic',
    number: '02 / 20',
    bounds: [[13.27488489, 52.54882258], [13.31020587, 52.56154831]],
    descriptionKey: 'urbanTechRepublicDescription',
    projectAreaId: 'urban-tech-republic'
  },
  'schumacher-quartier': {
    nameKey: 'schumacherQuartier',
    number: '03 / 20',
    bounds: [[13.31067033, 52.55888093], [13.32751649, 52.56537308]],
    descriptionKey: 'schumacherQuartierDescription',
    projectAreaId: 'schumacher-quartier'
  },
  'tegeler-stadtheide': {
    nameKey: 'tegelerStadtheide',
    number: '01 / 20',
    bounds: [[13.25635322, 52.55243287], [13.30305156, 52.56572367]],
    descriptionKey: 'tegelerStadtheideDescription',
    projectAreaId: 'tegeler-stadtheide'
  },
  'heideblick': {
    nameKey: 'heideblick',
    number: '07 / 20',
    coordinates: [13.265539352308727, 52.56025064158781],
    images: [
      {
        src: '/images/heideblick.jpg',
        labelKey: 'currentImage',
        credit: 'Thomas Rosenthal'
      },
      {
        src: '/images/heideblick_concept.jpg',
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl'
      }
    ],
    descriptionKey: 'heideblickDescription',
    source: 'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt'
  },
  'bunker': {
    nameKey: 'recreation',
    number: '08 / 20',
    coordinates: [13.25783266632616, 52.55416615425812],
    images: [
      {
        src: '/images/bunker.jpg',
        labelKey: 'currentImage',
        credit: 'Thomas Rosenthal'
      },
      {
        src: '/images/bunker_concept.jpg',
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl'
      }
    ],
    descriptionKey: 'recreationDescription',
    source: 'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt'
  },
  'rundbogenantenne': {
    nameKey: 'archedAntenna',
    number: '09 / 20',
    coordinates: [13.287565760368738, 52.56150630401666],
    images: [
      {
        src: '/images/rundbogenantenne.jpg',
        labelKey: 'currentImage',
        credit: 'Thomas Rosenthal'
      },
      {
        src: '/images/rundbogenantenne_concept.jpg',
        labelKey: 'conceptImage',
        credit: 'Atelier Loidl'
      }
    ],
    descriptionKey: 'archedAntennaDescription',
    source: 'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt'
  },
  'zelt': {
    nameKey: 'tent',
    number: '10 / 20',
    coordinates: [13.27559195542228, 52.55301043217409],
    descriptionKey: 'tentDescription'
  },
  'northern-runway': {
    nameKey: 'northernRunway',
    number: '11 / 20',
    coordinates: [13.27325037503029, 52.55832749635448], //,
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'northernRunwayDescription'
  },
  'southern-runway': {
    nameKey: 'southernRunway',
    number: '12 / 20',
    coordinates: [13.295831615387536, 52.558694994641904],
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'southernRunwayDescription'
  },
  'airfield-lighting': {
    nameKey: 'airfieldLighting',
    number: '13 / 20',
    coordinates: [13.260998045156224, 52.557178333184616], 
    image: '/images/befeuerungsanlage.jpg',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'airfieldLightingDescription'
  },
  'landscape-park': {
    nameKey: 'landscapePark',
    number: '14 / 20',
    coordinates: [13.3054988885774, 52.56307055794183],
    descriptionKey: 'landscapeParkDescription'
  },
  'schumacher-quartier-place': {
    nameKey: 'schumacherQuartier',
    number: '15 / 20',
    coordinates: [13.314237018067079, 52.560911421590774], 
    descriptionKey: 'schumacherQuartierDescription'
  },
  'sunbathing-lawn': {
    nameKey: 'sunbathingLawn',
    number: '16 / 20',
    coordinates: [13.267099307246742, 52.55834173147002],
    descriptionKey: 'sunbathingLawnDescription'
  },
  'future-tree-nursery': {
    nameKey: 'futureTreeNursery',
    number: '17 / 20',
    coordinates: [13.274933586150038, 52.55438073692916],
    descriptionKey: 'futureTreeNurseryDescription'
  },
  'radar-plateau': {
    nameKey: 'radarPlateau',
    number: '18 / 20',
    coordinates: [13.280517944905284, 52.56344500035554],
    descriptionKey: 'radarPlateauDescription'
  },
  'landscape-maintenance-hub': {
    nameKey: 'landscapeMaintenanceHub',
    number: '19 / 20',
    coordinates: [13.275860728255148, 52.554660081211594],
    descriptionKey: 'landscapeMaintenanceHubDescription'
  },
  'grazing-zone': {
    nameKey: 'grazingZone',
    number: '20 / 20',
    coordinates: [13.28397881028478, 52.56091067585946],
    descriptionKey: 'grazingZoneDescription'
  }
};

export const campusCamera = {
  center: [13.2904, 52.5540],
  zoom: 15.95,
  pitch: 58,
  bearing: -24
};

export const airportBounds = [[13.2559, 52.5481], [13.3285, 52.5686]];

// Keeps panning local while leaving enough surrounding map for the wide airport
// footprint to fit into narrow and portrait viewports.
export const airportNavigationBounds = [[13.242, 52.524], [13.342, 52.594]];

export const airportViewPadding = () => window.innerWidth < 700 ? 32 : 72;

export const satelliteBasemapConfig = {
  sourceId: 'berlin-true-orthophotos',
  layerId: 'berlin-true-orthophotos-raster',
  tiles: [
    'https://gdi.berlin.de/services/wms/truedop_2025_sommer?service=WMS&version=1.1.1&request=GetMap&layers=truedop_2025_sommer_rgb&styles=&format=image/jpeg&transparent=false&srs=EPSG:3857&width=512&height=512&bbox={bbox-epsg-3857}'
  ],
  tileSize: 512,
  attribution:
    'Luftbild: Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen Berlin · dl-de-zero-2.0'
};

export const groundHeightConfig = {
  csvUrl: '/data/txl-ground-heights.csv',
  boundaryUrl: '/data/txl-project-boundary.geojson',
  analysisAreaUrl: projectAreasDataUrl,
  analysisAreaProperty: 'teilraum',
  analysisAreaValue: 'Landschaftsraum',
  cellSizeMeters: 3,
  sourceId: 'txl-ground-heights',
  boundarySourceId: 'txl-project-boundary',
  fillLayerId: 'txl-ground-height-overlay',
  cellOutlineLayerId: 'txl-ground-height-outline',
  boundaryLayerId: 'txl-project-boundary',
  beforeLayerId: 'txl-3d-buildings',
  colors: {
    obstacle: '#dd4444',
    clear: '#35a66f',
    grid: '#74827e',
    boundary: '#000000'
  }
};

export const projectAreas = {
  'urban-tech-republic': {
    sourceName: 'Urban Tech Republic',
    labelKey: 'urbanTechRepublic',
    color: '#a61be1'
  },
  'schumacher-quartier': {
    sourceName: 'Schumacher Quartier',
    labelKey: 'schumacherQuartier',
    color: '#c82121'
  },
  'tegeler-stadtheide': {
    sourceName: 'Landschaftsraum',
    labelKey: 'tegelerStadtheide',
    color: '#166cb8'
  }
};

export const projectAreaConfig = {
  sourceId: 'txl-project-areas',
  sourceUrl: projectAreasDataUrl,
  fillLayerId: 'txl-project-areas-fill',
  outlineLayerId: 'txl-project-areas-outline',
  labelLayerId: 'txl-project-areas-label',
  beforeLayerId: 'txl-3d-buildings'
};
