# Berlin TXL 3D map

An interactive map of the former Berlin Tegel Airport terminal area and today's Tegeler Stadtheide. This student project was developed at HTW Berlin with CityLAB Berlin, LiFo Lab and Grün Berlin GmbH.

The application uses Vue 3 for its page structure and shared interface state, Tailwind CSS 4 for layout utilities, and MapLibre GL JS for the interactive map. Detailed map and theme styles remain in CSS, keeping the visual design and map controls consistent.

## Explore places and events

Open Places in the sidebar or select a place marker on the map to discover sites around Berlin TXL and Tegeler Stadtheide. Selecting a place focuses the map and opens a popup with a description and where available, photos or concept images. Places with multiple images have a small gallery that lets you switch between current views and future concepts.

Select the Event tent on the map or in the Places list to browse the Tegeler Stadtheide event calendar. The tent popup and sidebar show event dates, times and availability, with filters for status, format and target group. Open an event to see more details, visit its source page or download an `.ics` file to add it to your calendar. The event list is loaded from `public/data/campus_stadt_natur_tegeler_stadtheide_events.json`. Its heading links to the external Campus Stadt Natur calendar.

## Run locally

From this directory:

```powershell
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). Run `pnpm build` to create production files in `dist/`, and `pnpm preview` to check that build locally.

The map needs an internet connection for OpenFreeMap vector tiles, the optional Berlin aerial-photo layer, and Google Fonts. MapLibre GL JS is installed and bundled locally through pnpm. Building footprints and heights come from OpenStreetMap via OpenFreeMap. The satellite toggle uses the official Berlin TrueDOP 2025 summer orthophotos from the Senate Department for Urban Development, Building and Housing under the Data licence Germany – Zero – Version 2.0. The place pins are based on OpenStreetMap geocoding. Place descriptions draw on [Grün Berlin](https://gruen-berlin.de/pressemitteilung/landschaftspark-der-tegeler-stadtheide-kampfmittelraeumung-fruehzeitig-abgeschlossen-mit-grossen-schritten-und-ki-richtung-zukunft) and [Berlin TXL](https://berlintxl.de/). These sources also provide the 190-hectare and 500-hectare figures, respectively. The 3D view shows mapped existing buildings, not a model of proposed construction. The wider airport view provides context and is not an official project boundary.

The interface can be switched between English, German, and French. Translations are maintained in `src/i18n.js`. Language, theme, and sidebar preferences are managed in `public/ui-preferences.js` and stored locally in the browser.

The three central project areas - Urban Tech Republic, Schumacher Quartier and Landschaftsraum Tegeler Stadtheide - are stored locally in `public/data/txl-project-areas.geojson` and can be shown or hidden independently with the map controls. The file is a browser-optimised copy of the official Berlin TXL WFS `b_teilraeume` layer. The source value “Landschaftsraum” appears in the interface under its full project name.

## Ground-height CSV

The red/green measurement-point analysis reads `public/data/txl-ground-heights.csv`. Replace the sample rows with your own measurements while keeping these columns:

```csv
longitude,latitude,ground_height_m,label
13.2880,52.5530,36.7,Referenz
13.2881,52.5531,36.9,Messpunkt 1
```

Comma- and semicolon-separated files are supported. Exactly one row must have the label `Referenz`. Its `ground_height_m` is the fixed reference height and is not treated as a measurement. When Trees or Depressions are active in the internal view, labels beginning with `Baum` use a tree icon, while labels beginning with `Kuhle` use a depression icon. A blue survey-target icon identifies the separate reference point. Measurement labels appear at close zoom levels, and hovering over an icon shows its measured height and difference from the reference. There is no grid or interpolation. The height-tolerance panel appears automatically when either measurement category is active. Its slider colors measurement icons red when their absolute difference from the CSV reference is greater than or equal to the selected value, points within tolerance stay green.

The sidebar's internal view switch opens independent filters for Forest health, Trees, and Depressions, plus controls to show or hide all three together. Forest health controls the tree canopy health polygons and their outlines. Trees and Depressions filter the CSV measurement markers. Whenever either measurement category is selected, the reference point and person markers appear too.

When Forest health is active, its panel filters canopy polygons by GCC green share. By default, the minimum threshold ranges from 0 to 100 percent. At 0 percent, all trees remain visible. You can combine this filter with tree height and crown diameter, switch each threshold between minimum and maximum, or show only trees with conspicuous crowns. The filters also apply to tree outlines and conspicuous-tree markers.

The project outline comes from `public/data/txl-project-boundary.geojson`, derived from the official Berlin WFS dataset "Berlin TXL" and simplified for browser rendering. Boundary source: Tegel Projekt GmbH / Berlin TXL, licensed under CC BY 4.0.

## Project structure

- `index.html` - Vite's minimal page entry at the project root
- `src/main.js` - Vue application mount and translation directives
- `src/App.vue` and `src/atlas-state.js` - application shell, shared reactive state, and map lifecycle
- `src/components/Sidebar.vue` - sidebar layout and internal-view controls
- `src/components/PlacesList.vue` - ordered place list, names, and subtitles
- `src/components/PlaceDetail.vue` and `src/components/EventsView.vue` - selected place and event views
- `src/components/MapStage.vue` and `src/components/TreeHealthControls.vue` - map canvas and analysis controls
- `src/style.css` and `vite.config.js` - application styles, Tailwind theme, and Vue/Tailwind Vite plugins
- `src/map-app.js` - MapLibre bootstrap and coordination of map services
- `src/analysis-panel-layout.js` - responsive positioning and collapse behavior of the map analysis panels
- `src/config.js` - place data and images, map cameras, boundaries, and overlay configuration
- `src/basemap-controller.js` - street/satellite basemap toggle and aerial-photo layer
- `src/map-controller.js` - map views, building layer, place and event popups, markers, and event data loading
- `src/tree-health-overlay.js` - tree layers, popups, and map filters
- `src/ground-height-analysis.js` - CSV parsing and reference extraction
- `src/ground-height-overlay.js` - MapLibre measurement layers, internal-view filters, and popups
- `src/project-areas-overlay.js` - MapLibre layers and visibility controls for the local project-area GeoJSON
- `public/ui-preferences.js` and `src/ui-preferences.js` - early theme setup and persisted language, theme, and sidebar preferences
- `src/localization.js` and `src/translate.js` - language application, map-control labels, and shared translation lookup
- `src/event-utils.js` - event filtering and calendar export
- `src/number-format.js` - shared decimal formatting for analysis values
- `src/i18n.js` - English, German, and French interface translations
- `public/data/txl-ground-heights.csv` - replaceable ground-height input (currently a small real-world test sample)
- `public/data/txl-project-boundary.geojson` - simplified official Berlin TXL project boundary
- `public/data/txl-project-areas.geojson` - simplified official project-area boundaries
- `public/data/baeume.geojson` - tree canopy polygons used by the Forest health overlay
- `public/data/campus_stadt_natur_tegeler_stadtheide_events.json` - local event list shown at the Event tent
- `dist/` - generated production build


Vue owns the page controls, labels, and analysis values. The MapLibre modules own map layers, markers, and popups. They receive user choices through `src/map-app.js` and write result data to the shared state. `src/analysis-panel-layout.js` handles map panel positioning and collapse behavior because those depend on measured map dimensions.

## Extend the app in general

Small changes are easiest to understand by following an existing feature. An editor's file search can locate a visible label, a file name or an existing control in the code. In Vue files, `<template>` contains the visible elements and `<script setup>` contains their behavior. These files are common starting points:

| Intended change | Relevant files |
| --- | --- |
| Change a label or translation | `src/i18n.js`, new text keys are added in `en`, `de` and `fr`. |
| Change the appearance or sidebar content | `src/style.css` for colors, spacing and presentation, `src/components/Sidebar.vue`, `PlacesList.vue` or `PlaceDetail.vue` for content, `src/components/MapStage.vue` for map controls. |
| Change a map view or marker | `src/config.js` for coordinates and the initial view, `src/map-controller.js` for markers, popups and map movement, `src/map-app.js` connects the map modules. |
| Change data or an analysis | `public/data/` for input files, `src/ground-height-analysis.js`, `src/ground-height-overlay.js` and `src/tree-health-overlay.js` for processing and display. Existing file formats and columns must be kept unless the corresponding loader is updated too. |

New controls may require changes in several places: the component displays the control, `src/App.vue` handles the selection, and `src/atlas-state.js` holds shared state. If the selection affects the map, `src/map-app.js` passes it to the relevant map module. A similar existing control provides a useful example.

During development, `pnpm dev` shows changes locally. After a change, the affected feature, its appearance on a narrow screen and, where relevant, all three languages should be checked. `pnpm build` then checks whether a production build can be created. Files in `dist/` and `node_modules/` are generated or installed and are not starting points for project changes.

## Extend the app: add a place

Small changes require only a text editor, Node.js and pnpm. The app is started with `pnpm dev` as shown above, the terminal stays open. Vite updates the browser page after changes are saved. The main files are `src/config.js` (place data), `src/components/PlacesList.vue` (sidebar order and subtitles), and `src/i18n.js` (English, German and French text). An ordinary place with a map marker does not require changes to `src/map-controller.js`.

1. **Add the place:** An entry is added to the `places` object in `src/config.js`. An existing place with `coordinates`, such as `heideblick`, can serve as a guide. A simple entry without an image looks like this:

   ```js
   'new-place': {
     name: 'New place',
     number: '24 / 24',
     coordinates: [13.2756, 52.5530],
     description: 'Short description of this place.',
     source: 'https://example.org/more-information',
   },
   ```

   The example values must be replaced with real information. `new-place` is a unique ID that is also used in step 2. Coordinates can be found in a map app. In `coordinates`, **longitude comes first, then latitude** (`[longitude, latitude]`), some map apps display them in the opposite order. The `source` link is optional and can be omitted. `name` and `description` are fixed text and appear unchanged in all three languages. The second number in `number` represents the current total of 23 places and project areas. When a 24th entry is added, `/ 23` is changed to `/ 24` in the existing entries too.

2. **Show it in the sidebar:** In `src/components/PlacesList.vue`, `'new-place'` is inserted in the `terminalPlaceIds` array at the desired position. The line `'new-place': 'newPlaceSubtitle',` is added to the `subtitleKeys` object. The array position sets the list order, `number` sets the displayed number.

3. **Translate the subtitle:** In `src/i18n.js`, the same `newPlaceSubtitle` key is added inside **each** language block (`en`, `de`, `fr`), for example `newPlaceSubtitle: 'New place',` in English, `newPlaceSubtitle: 'Neuer Ort',` in German and `newPlaceSubtitle: 'Nouveau lieu',` in French. The key must be spelled identically in all three blocks. For translated names and descriptions, further keys are added there and `nameKey` and `descriptionKey` are used instead of `name` and `description` in `src/config.js` (see existing places).

4. **Optionally add a photo:** An image file can be placed in `src/assets/images/` and imported at the top of `src/config.js`, for example with `import newPlaceImage from './assets/images/new-place.jpg';`. The place then receives `images: [{ src: newPlaceImage, labelKey: 'currentImage', credit: 'Photographer name' }],`. More objects can be added to `images` for additional photos. The image source should be documented in [`../README.md`](../README.md).

5. **Check the result:** On the local page, Places is switched on and the new place is selected in the list and on the map. The marker position, description, link, optional image and all three languages should be checked. Finally, `pnpm build` is run in the `website` directory. If the place is missing from the list, the IDs in `places` and `terminalPlaceIds` should be compared, if the marker is in the wrong position, the coordinate order should be checked.
