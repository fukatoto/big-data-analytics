# Berlin TXL 3D-Karte

Eine interaktive Karte des ehemaligen Terminalbereichs des Flughafens Berlin-Tegel und der heutigen Tegeler Stadtheide. Dieses studentische Projekt wurde an der HTW Berlin mit dem CityLAB Berlin, dem LiFo Lab und der Grün Berlin GmbH entwickelt.

Die Anwendung nutzt Vue 3 für die Seitenstruktur und den gemeinsamen Oberflächenzustand, Tailwind CSS 4 für das Layout und MapLibre GL JS für die interaktive Karte. Detaillierte Karten- und Designstile bleiben in CSS erhalten, damit Gestaltung und Kartensteuerung konsistent bleiben.

## Orte und Veranstaltungen entdecken

Über „Orte“ in der Seitenleiste oder die Ortsmarker auf der Karte lassen sich Standorte rund um Berlin TXL und die Tegeler Stadtheide entdecken. Die Auswahl eines Ortes richtet die Karte darauf aus und öffnet ein Popup mit einer Beschreibung sowie, sofern vorhanden, Fotos oder Konzeptbildern. Bei Orten mit mehreren Bildern kann zwischen aktuellen Ansichten und Zukunftsentwürfen gewechselt werden.

Über das Eventzelt auf der Karte oder in der Ortsliste lässt sich der Veranstaltungskalender für die Tegeler Stadtheide aufrufen. Das Popup am Zelt und die Seitenleiste zeigen Termine, Uhrzeiten und Verfügbarkeiten; die Veranstaltungen lassen sich nach Status, Format und Zielgruppe filtern. Zu jeder Veranstaltung können weitere Informationen geöffnet, die Quellseite besucht oder eine `.ics`-Datei für den eigenen Kalender heruntergeladen werden. Die Veranstaltungsliste wird aus `public/data/campus_stadt_natur_tegeler_stadtheide_events.json` geladen. Ihre Überschrift führt zum externen Kalender von Campus Stadt Natur.

## Lokal starten

Aus diesem Verzeichnis:

```powershell
pnpm install
pnpm dev
```

Die von Vite ausgegebene lokale Adresse öffnen (normalerweise `http://127.0.0.1:5173`). Mit `pnpm build` entstehen die Produktionsdateien in `dist/`, mit `pnpm preview` lässt sich dieser Build lokal prüfen.

Die Karte benötigt eine Internetverbindung für die Vektorkacheln von OpenFreeMap, die optionale Berliner Luftbildebene und Google Fonts. MapLibre GL JS wird über pnpm installiert und lokal mitgebündelt. Gebäudegrundrisse und -höhen stammen aus OpenStreetMap über OpenFreeMap. Die Satellitenansicht nutzt die amtlichen TrueDOP-Sommerorthophotos 2025 der Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen unter der Datenlizenz Deutschland – Zero – Version 2.0. Die Ortsmarker beruhen auf OpenStreetMap-Geokodierung. Ortsbeschreibungen stützen sich auf [Grün Berlin](https://gruen-berlin.de/pressemitteilung/landschaftspark-der-tegeler-stadtheide-kampfmittelraeumung-fruehzeitig-abgeschlossen-mit-grossen-schritten-und-ki-richtung-zukunft) und [Berlin TXL](https://berlintxl.de/). Von diesen Quellen stammen auch die Angaben von 190 beziehungsweise 500 Hektar. Die 3D-Ansicht zeigt kartierte Bestandsgebäude, kein Modell geplanter Neubauten. Die weiter gefasste Flughafenansicht dient der Orientierung und ist keine offizielle Projektgrenze.

Die Oberfläche lässt sich zwischen Englisch, Deutsch und Französisch umschalten. Die Übersetzungen werden in `src/i18n.js` gepflegt. Sprache, Designmodus und Seitenleisten-Einstellungen werden in `public/ui-preferences.js` verwaltet und lokal im Browser gespeichert.

Die drei zentralen Projektgebiete – Urban Tech Republic, Schumacher Quartier und Landschaftsraum Tegeler Stadtheide – liegen lokal in `public/data/txl-project-areas.geojson` und lassen sich über die Kartensteuerung unabhängig voneinander ein- und ausblenden. Die Datei ist eine für den Browser optimierte Kopie des amtlichen Berlin-TXL-WFS-Layers `b_teilraeume`. Der Quellwert „Landschaftsraum“ wird in der Oberfläche mit seinem vollständigen Projektnamen angezeigt.

## Bodenhöhen-CSV

Die rot-grüne Messpunktanalyse liest `public/data/txl-ground-heights.csv`. Die Testdaten können durch eigene Messwerte ersetzt werden, solange diese Spalten erhalten bleiben:

```csv
longitude,latitude,ground_height_m,label
13.2880,52.5530,36.7,Referenz
13.2881,52.5531,36.9,Messpunkt 1
```

Dateien mit Komma oder Semikolon als Trennzeichen werden unterstützt. Genau eine Zeile muss das Label `Referenz` tragen. Ihr Wert für `ground_height_m` ist die feste Referenzhöhe und wird nicht als Messung behandelt. Wenn in der internen Ansicht Bäume oder Kuhlen aktiv sind, erhalten Labels, die mit `Baum` beginnen, ein Baumsymbol und Labels, die mit `Kuhle` beginnen, ein Kuhlensymbol. Ein blaues Vermessungssymbol kennzeichnet den separaten Referenzpunkt. Die Labels der Messpunkte erscheinen bei nahen Zoomstufen; beim Überfahren eines Symbols werden die gemessene Höhe und die Abweichung von der Referenz angezeigt. Es gibt weder ein Raster noch eine Interpolation. Das Höhentoleranzfenster erscheint automatisch, sobald eine der beiden Messkategorien aktiv ist. Sein Regler färbt Messpunktsymbole rot, wenn ihre absolute Abweichung von der CSV-Referenz größer oder gleich dem gewählten Wert ist. Punkte innerhalb der Toleranz bleiben grün.

Der Schalter für die interne Ansicht in der Seitenleiste öffnet unabhängige Filter für Waldgesundheit, Bäume und Kuhlen sowie Steuerelemente, mit denen sich alle drei gemeinsam ein- oder ausblenden lassen. Waldgesundheit steuert die Polygone der Baumkronengesundheit und deren Umrisse. Bäume und Kuhlen filtern die CSV-Messpunktmarker. Sobald eine dieser beiden Messkategorien ausgewählt ist, werden auch der Referenzpunkt und die Personenmarker angezeigt.

Wenn Waldgesundheit aktiv ist, filtert das zugehörige Fenster die Kronenpolygone nach ihrem GCC-Grünanteil. Standardmäßig reicht der Mindestwert von 0 bis 100 Prozent. Bei 0 Prozent bleiben alle Bäume sichtbar. Dieser Filter lässt sich mit Baumhöhe und Kronendurchmesser kombinieren. Jeder Schwellwert kann zwischen Mindest- und Höchstwert umgeschaltet werden; außerdem können ausschließlich Bäume mit auffälligen Kronen angezeigt werden. Die Filter gelten auch für Baumumrisse und Marker auffälliger Bäume.

Die Projektgrenze stammt aus `public/data/txl-project-boundary.geojson`, wurde aus dem amtlichen Berliner WFS-Datensatz „Berlin TXL“ abgeleitet und für die Darstellung im Browser vereinfacht. Quelle der Grenze: Tegel Projekt GmbH / Berlin TXL, lizenziert unter CC BY 4.0.

## Projektstruktur

- `index.html` – Vites minimale Einstiegsseite im Projektwurzelverzeichnis
- `src/main.js` – Einbindung der Vue-Anwendung und Übersetzungsdirektiven
- `src/App.vue` und `src/atlas-state.js` – Anwendungshülle, gemeinsamer reaktiver Zustand und Lebenszyklus der Karte
- `src/components/Sidebar.vue` – Seitenleistenlayout und Steuerung der internen Ansicht
- `src/components/PlacesList.vue` – sortierte Ortsliste mit Namen und Untertiteln
- `src/components/PlaceDetail.vue` und `src/components/EventsView.vue` – Ansichten für ausgewählte Orte und Veranstaltungen
- `src/components/MapStage.vue` und `src/components/TreeHealthControls.vue` – Kartenfläche und Analysesteuerung
- `src/style.css` und `vite.config.js` – Anwendungsstile, Tailwind-Design und Vue-/Tailwind-Vite-Plugins
- `src/map-app.js` – Initialisierung von MapLibre und Koordination der Kartendienste
- `src/analysis-panel-layout.js` – responsive Positionierung und Einklappen der Analysefenster auf der Karte
- `src/config.js` – Ortsdaten und Bilder sowie Konfiguration für Kartenansichten, Grenzen und Overlays
- `src/basemap-controller.js` – Umschaltung zwischen Straßen- und Satellitenkarte sowie Luftbildebene
- `src/map-controller.js` – Kartenansichten, Gebäudeebene, Orts- und Veranstaltungs-Popups, Marker und Laden der Veranstaltungsdaten
- `src/tree-health-overlay.js` – Baumebenen, Popups und Kartenfilter
- `src/ground-height-analysis.js` – CSV-Auswertung und Ermittlung der Referenz
- `src/ground-height-overlay.js` – MapLibre-Messpunktebenen, Filter der internen Ansicht und Popups
- `src/project-areas-overlay.js` – MapLibre-Ebenen und Sichtbarkeitsschalter für die lokale Projektgebiets-GeoJSON-Datei
- `public/ui-preferences.js` und `src/ui-preferences.js` – frühe Initialisierung des Designmodus und gespeicherte Einstellungen für Sprache, Designmodus und Seitenleiste
- `src/localization.js` und `src/translate.js` – Anwendung der Spracheinstellung, Beschriftungen der Kartensteuerung und gemeinsame Übersetzungsabfrage
- `src/event-utils.js` – Veranstaltungsfilter und Kalenderexport
- `src/number-format.js` – gemeinsame Dezimalformatierung für Analysewerte
- `src/i18n.js` – englische, deutsche und französische Oberflächenübersetzungen
- `public/data/txl-ground-heights.csv` – austauschbare Bodenhöhen-Eingabedatei (derzeit eine kleine Teststichprobe mit realen Messwerten)
- `public/data/txl-project-boundary.geojson` – vereinfachte amtliche Berlin-TXL-Projektgrenze
- `public/data/txl-project-areas.geojson` – vereinfachte amtliche Projektgebietsgrenzen
- `public/data/baeume.geojson` – Baumkronenpolygone für die Waldgesundheitsebene
- `public/data/campus_stadt_natur_tegeler_stadtheide_events.json` – lokale Veranstaltungsliste für das Eventzelt
- `dist/` – erzeugter Produktionsbuild

Vue verwaltet die Seitensteuerung, Beschriftungen und Analysewerte. Die MapLibre-Module verwalten Kartenebenen, Marker und Popups; sie erhalten die Einstellungen der Nutzer über `src/map-app.js` und schreiben Ergebnisdaten in den gemeinsamen Zustand. `src/analysis-panel-layout.js` übernimmt die Positionierung und das Einklappen der Kartenfenster, da diese Funktionen von den gemessenen Kartenabmessungen abhängen.
