export const projectAreasDataUrl = '/data/txl-project-areas.geojson';

// Coordinate-based places use `image`, `imageAlt`, and `description` (or
// `descriptionKey`) for their map popup. Replace `/images/plane.png` with a
// place-specific image stored in `public/` when the final photos are available.
export const places = {
  'terminal-a': {
    name: 'Terminal A',
    number: '04 / 12',
    coordinates: [13.2889469, 52.5544223],
    image: '/images/plane.png',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'terminalADescription',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/'
  },
  'terminal-b': {
    name: 'Terminal B',
    number: '05 / 12',
    coordinates: [13.2920506, 52.5541399],
    image: '/images/plane.png',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'terminalBDescription',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/'
  },
  'terminal-d': {
    name: 'Terminal D',
    number: '06 / 12',
    coordinates: [13.2916620, 52.5523579],
    image: '/images/plane.png',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'terminalDDescription',
    source: 'https://urbantechrepublic.de/en/faq/'
  },
  'urban-tech-republic': {
    nameKey: 'urbanTechRepublic',
    number: '02 / 12',
    bounds: [[13.27488489, 52.54882258], [13.31020587, 52.56154831]],
    descriptionKey: 'urbanTechRepublicDescription',
    projectAreaId: 'urban-tech-republic'
  },
  'schumacher-quartier': {
    nameKey: 'schumacherQuartier',
    number: '03 / 12',
    bounds: [[13.31067033, 52.55888093], [13.32751649, 52.56537308]],
    descriptionKey: 'schumacherQuartierDescription',
    projectAreaId: 'schumacher-quartier'
  },
  'tegeler-stadtheide': {
    nameKey: 'tegelerStadtheide',
    number: '01 / 12',
    bounds: [[13.25635322, 52.55243287], [13.30305156, 52.56572367]],
    descriptionKey: 'tegelerStadtheideDescription',
    projectAreaId: 'tegeler-stadtheide'
  },
  'heideblick': {
    nameKey: 'heideblick',
    number: '07 / 12',
    coordinates: [13.265539352308727, 52.56025064158781],
    image: '/images/plane.png',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'heideblickDescription',
    source: 'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt'
  },
  'bunker': {
    nameKey: 'recreation',
    number: '08 / 12',
    coordinates: [13.25783266632616, 52.55416615425812],
    image: '/images/plane.png',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'recreationDescription',
    source: 'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt'
  },
  'rundbogenantenne': {
    nameKey: 'archedAntenna',
    number: '09 / 12',
    coordinates: [13.287565760368738, 52.56150630401666],
    image: '/images/plane.png',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'archedAntennaDescription',
    source: 'https://gruen-berlin.de/projekte/urbane-freiraeume/landschaftsraum-tegel-tegeler-stadtheide/ueber-das-projekt'
  },
  'zelt': {
    name: 'Zelt',
    number: '10 / 12',
    coordinates: [13.27559195542228, 52.55301043217409],
    descriptionKey: 'tentDescription'
  },
  'northern-runway': {
    nameKey: 'northernRunway',
    number: '11 / 12',
    coordinates: [13.27325037503029, 52.55832749635448], //,
    image: '/images/plane.png',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'northernRunwayDescription'
  },
  'southern-runway': {
    nameKey: 'southernRunway',
    number: '12 / 12',
    coordinates: [13.295831615387536, 52.558694994641904],
    image: '/images/plane.png',
    imageAlt: '',
    coverImageCredit: '',
    descriptionKey: 'southernRunwayDescription'
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
