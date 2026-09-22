# Berlin TXL 3D map

An interactive map of the former Berlin Tegel Airport terminal area and today's Tegeler Stadtheide. This began as a student project with CityLAB Berlin, LiFo Lab and Grün Berlin.

## Run locally

From this directory:

```powershell
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:4175`). Run `pnpm build` to create production files in `dist/`, and `pnpm preview` to check that build locally.

The map needs an internet connection for OpenFreeMap vector tiles, the optional Berlin aerial-photo layer, and Google Fonts. MapLibre GL JS is installed and bundled locally through pnpm. Building shapes and heights come from OpenStreetMap via OpenFreeMap. The satellite toggle uses the official Berlin TrueDOP 2025 summer orthophotos from the Senate Department for Urban Development, Building and Housing under the Data licence Germany – Zero – Version 2.0. The place pins are based on OpenStreetMap geocoding, descriptions and the 202-hectare figure come from [Urban Tech Republic](https://urbantechrepublic.de/en/faq/). The 3D view shows mapped existing buildings, not a model of proposed construction. The wider airport view is context, not an official project boundary.

The interface can be switched between English, German, and French. Translations are maintained in `src/i18n.js`, the selected language is stored locally in the browser.

The three central project areas — Urban Tech Republic, Schumacher Quartier, and Landschaftsraum Tegeler Stadtheide — are stored locally in `public/data/txl-project-areas.geojson` and can be shown or hidden independently with the map controls. The file is a browser-optimised copy of the official Berlin TXL WFS `b_teilraeume` layer, the source value “Landschaftsraum” is presented in the interface with its full project name.

## Ground-height CSV

The red/green measurement-point analysis reads `public/data/txl-ground-heights.csv`. Replace the dummy rows with real measurements while keeping these columns:

```csv
longitude,latitude,ground_height_m,label
13.2880,52.5530,36.7,Referenz
13.2881,52.5531,36.9,Messpunkt 1
```

Comma- and semicolon-separated files are supported. Exactly one row must have the label `Referenz`, its `ground_height_m` is the fixed reference height and is not treated as a measurement. When the height analysis is active, labels beginning with `Baum` use a tree icon and labels beginning with `Kuhle` use a depression icon, a blue survey-target icon identifies the separate reference point. Measurement labels appear at close zoom levels, and hovering an icon shows its measured height and difference from the reference. There is no grid or interpolation. The slider threshold colors measurement icons red when their absolute difference from the CSV reference is greater than or equal to the selected value, points within tolerance stay green.

The project outline comes from `public/data/txl-project-boundary.geojson`, derived from the official Berlin WFS dataset “Berlin TXL” and simplified for browser rendering. Boundary source: Tegel Projekt GmbH / Berlin TXL, licensed under CC BY 4.0.

## Project structure

- `index.html` — Vite's page entry at the project root
- `src/main.js` — small application bootstrap that connects the modules
- `src/config.js` — shared map, camera, boundary, and overlay configuration
- `src/basemap-controller.js` — street/satellite basemap toggle and aerial-photo layer
- `src/map-controller.js` — map views, markers, 2D/3D controls, and place selection
- `src/ground-height-analysis.js` — CSV parsing and reference extraction
- `src/ground-height-overlay.js` — MapLibre layers, slider updates, counts, and popups
- `src/project-areas-overlay.js` — official WFS project-area layers and visibility toggles
- `src/localization.js` — language selection and dynamic UI translation
- `src/i18n.js` — English, German, and French interface translations
- `src/style.css` — map layout and responsive styles
- `public/data/txl-ground-heights.csv` — replaceable ground-height input (currently dummy data)
- `public/data/txl-project-boundary.geojson` — simplified official Berlin TXL project boundary
- `public/data/txl-project-areas.geojson` — simplified official project-area boundaries
- `dist/` — generated production build
