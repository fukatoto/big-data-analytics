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

## Project structure

- `index.html` — Vite's page entry at the project root
- `src/main.js` — map setup and interactions
- `src/style.css` — map layout and responsive styles
- `dist/` — generated production build
