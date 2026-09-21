export const places = {
  'terminal-a': {
    name: 'Terminal A',
    number: '04 / 06',
    coordinates: [13.2889469, 52.5544223],
    descriptionKey: 'terminalADescription',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/'
  },
  'terminal-b': {
    name: 'Terminal B',
    number: '05 / 06',
    coordinates: [13.2920506, 52.5541399],
    descriptionKey: 'terminalBDescription',
    source: 'https://urbantechrepublic.de/en/real-estate-finder-map/'
  },
  'terminal-d': {
    name: 'Terminal D',
    number: '06 / 06',
    coordinates: [13.2916620, 52.5523579],
    descriptionKey: 'terminalDDescription',
    source: 'https://urbantechrepublic.de/en/faq/'
  },
  'urban-tech-republic': {
    nameKey: 'urbanTechRepublic',
    number: '02 / 06',
    bounds: [[13.27488489, 52.54882258], [13.31020587, 52.56154831]],
    descriptionKey: 'urbanTechRepublicDescription',
    source: 'https://gdi.berlin.de/services/wfs/berlin_txl?service=WFS&request=GetCapabilities',
    projectAreaId: 'urban-tech-republic'
  },
  'schumacher-quartier': {
    nameKey: 'schumacherQuartier',
    number: '03 / 06',
    bounds: [[13.31067033, 52.55888093], [13.32751649, 52.56537308]],
    descriptionKey: 'schumacherQuartierDescription',
    source: 'https://gdi.berlin.de/services/wfs/berlin_txl?service=WFS&request=GetCapabilities',
    projectAreaId: 'schumacher-quartier'
  },
  'tegeler-stadtheide': {
    nameKey: 'tegelerStadtheide',
    number: '01 / 06',
    bounds: [[13.25635322, 52.55243287], [13.30305156, 52.56572367]],
    descriptionKey: 'tegelerStadtheideDescription',
    source: 'https://gdi.berlin.de/services/wfs/berlin_txl?service=WFS&request=GetCapabilities',
    projectAreaId: 'tegeler-stadtheide'
  },
  'heideBlick': {
    name: 'Heideblick', number: '04 / 04', coordinates: [13.265540, 52.560249],
    description: 'The "Heideblick" offers a unique change of perspective: Let your gaze wander across the vast expanse of the heath, with the striking Berlin skyline in the background.',
    //source: 'https://urbantechrepublic.de/en/faq/'
  },
  'zelt': {
    name: 'Zelt', number: '04 / 04', coordinates: [13.275592, 52.553011],
    description: '',
    //source: 'https://urbantechrepublic.de/en/faq/'
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
  cellSizeMeters: 20,
  sourceId: 'txl-ground-heights',
  boundarySourceId: 'txl-project-boundary',
  fillLayerId: 'txl-ground-height-overlay',
  cellOutlineLayerId: 'txl-ground-height-outline',
  boundaryLayerId: 'txl-project-boundary',
  beforeLayerId: 'txl-3d-buildings',
  colors: {
    obstacle: '#dd4444',
    clear: '#35a66f',
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
  sourceUrl: 'https://gdi.berlin.de/services/wfs/berlin_txl?service=WFS&version=2.0.0&request=GetFeature&typeNames=berlin_txl%3Ab_teilraeume&outputFormat=application%2Fjson&srsName=EPSG%3A4326&CQL_FILTER=teilraum%20IN%20%28%27Urban%20Tech%20Republic%27%2C%27Landschaftsraum%27%2C%27Schumacher%20Quartier%27%29',
  fillLayerId: 'txl-project-areas-fill',
  outlineLayerId: 'txl-project-areas-outline',
  labelLayerId: 'txl-project-areas-label',
  beforeLayerId: 'txl-3d-buildings'
};
