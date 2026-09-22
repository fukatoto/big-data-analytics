# Berlin TXL 3D map

An interactive map of the former Berlin Tegel Airport terminal area and today's Urban Tech Republic. This began as a student project with CityLAB Berlin, LiFo Lab and Grün Berlin.

## Run locally

From this directory:

```powershell
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:4175`). Run `pnpm build` to create production files in `dist/`, and `pnpm preview` to check that build locally.

The map needs an internet connection for OpenFreeMap vector tiles and Google Fonts. MapLibre GL JS is installed and bundled locally through pnpm. Building shapes and heights come from OpenStreetMap via OpenFreeMap. The place pins are based on OpenStreetMap geocoding; descriptions and the 202-hectare figure come from [Urban Tech Republic](https://urbantechrepublic.de/en/faq/). The 3D view shows mapped existing buildings, not a model of proposed construction. The wider airport view is context, not an official project boundary.

The interface can be switched between English, German, and French. Translations are maintained in `src/i18n.js`; the selected language is stored locally in the browser.

The three central project areas — Urban Tech Republic, Schumacher Quartier, and Landschaftsraum Tegeler Stadtheide — are stored locally in `public/data/txl-project-areas.geojson` and can be shown or hidden independently with the map controls. The file is a browser-optimised copy of the official Berlin TXL WFS `b_teilraeume` layer; the source value “Landschaftsraum” is presented in the interface with its full project name.

## Ground-height CSV

The transparent red/green analysis overlay reads `public/data/txl-ground-heights.csv`. Replace the dummy rows with real measurements while keeping these columns:

```csv
longitude,latitude,ground_height_m
13.2880,52.5530,36.7
```

Comma- and semicolon-separated files are supported. Only measurements inside the official Tegeler Stadtheide landscape area are used. For every such measurement, the app uses the median height of up to six nearest measurements as its local reference. The values are interpolated onto a 20-metre analysis grid. The slider threshold marks analysed cells whose absolute difference from that reference is greater than or equal to the selected value as red obstacles; cells within tolerance stay green.

The grid is clipped to `public/data/txl-project-boundary.geojson` and remains visible throughout the Berlin TXL project boundary. Height-tolerance values and red/green analysis colors are only calculated for grid cells whose centres lie inside the local project area “Landschaftsraum” (Tegeler Stadtheide) from `public/data/txl-project-areas.geojson`; the remaining TXL cells are shown as a neutral grid without calculated values. Both boundary files are derived from the official Berlin WFS dataset “Berlin TXL” and simplified for browser rendering. Boundary source: Tegel Projekt GmbH / Berlin TXL, licensed under CC BY 4.0.

## Project structure

- `index.html` — Vite's page entry at the project root
- `src/main.js` — small application bootstrap that connects the modules
- `src/config.js` — shared map, camera, boundary, and overlay configuration
- `src/map-controller.js` — map views, markers, 2D/3D controls, and place selection
- `src/ground-height-analysis.js` — CSV parsing, interpolation, and boundary clipping
- `src/ground-height-overlay.js` — MapLibre layers, slider updates, counts, and popups
- `src/project-areas-overlay.js` — official WFS project-area layers and visibility toggles
- `src/localization.js` — language selection and dynamic UI translation
- `src/i18n.js` — English, German, and French interface translations
- `src/style.css` — map layout and responsive styles
- `public/data/txl-ground-heights.csv` — replaceable ground-height input (currently dummy data)
- `public/data/txl-project-boundary.geojson` — simplified official Berlin TXL project boundary
- `public/data/txl-project-areas.geojson` — simplified official project-area boundaries
- `dist/` — generated production build
