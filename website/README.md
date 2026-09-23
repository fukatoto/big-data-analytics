# Berlin TXL 3D-Karte

Eine interaktive Karte des ehemaligen Flughafengeländes Berlin-Tegel und der heutigen Urban Tech Republic. Entstanden ist sie als studentisches Projekt mit dem CityLAB Berlin, dem LiFo Lab und Grün Berlin.

## Lokal starten

Aus diesem Verzeichnis:

```powershell
pnpm install
pnpm dev
```

Die von Vite ausgegebene lokale Adresse öffnen (normalerweise `http://127.0.0.1:4175`). Mit `pnpm build` entstehen die Produktionsdateien in `dist/`, mit `pnpm preview` lässt sich dieser Build lokal prüfen.

Die Karte benötigt eine Internetverbindung für die Vektorkacheln von OpenFreeMap, die optionale Berliner Luftbildebene und Google Fonts. MapLibre GL JS wird über pnpm installiert und lokal mitgebündelt. Gebäudeumrisse und -höhen stammen aus OpenStreetMap über OpenFreeMap. Die Satellitenansicht nutzt die amtlichen TrueDOP-Sommerorthophotos 2025 der Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen unter der Datenlizenz Deutschland – Zero – Version 2.0. Die Ortsmarker beruhen auf OpenStreetMap-Geokodierung; die Beschreibungen und die Angabe von 202 Hektar stammen von [Urban Tech Republic](https://urbantechrepublic.de/en/faq/). Die 3D-Ansicht zeigt kartierte Bestandsgebäude, kein Modell geplanter Neubauten. Die weiter gefasste Flughafenansicht dient der Orientierung und ist keine offizielle Projektgrenze.

Die Oberfläche lässt sich zwischen Englisch, Deutsch und Französisch umschalten. Die Übersetzungen werden in `src/i18n.js` gepflegt; die gewählte Sprache wird lokal im Browser gespeichert.

Die drei zentralen Projektgebiete – Urban Tech Republic, Schumacher Quartier und Landschaftsraum Tegeler Stadtheide – liegen lokal in `public/data/txl-project-areas.geojson` und lassen sich über die Kartensteuerung unabhängig voneinander ein- und ausblenden. Die Datei ist eine für den Browser optimierte Kopie des amtlichen Berlin-TXL-WFS-Layers `b_teilraeume`; der Quellwert „Landschaftsraum“ wird in der Oberfläche mit seinem vollständigen Projektnamen angezeigt.

## Bodenhöhen-CSV

Die transparente rot-grüne Analyseebene liest `public/data/txl-ground-heights.csv`. Die Beispielzeilen können durch echte Messwerte ersetzt werden, solange diese Spalten erhalten bleiben:

```csv
longitude,latitude,ground_height_m
13.2880,52.5530,36.7
```

Verwendet werden nur Messwerte innerhalb des amtlichen Landschaftsraums Tegeler Stadtheide. Für jeden dieser Messwerte nutzt die Anwendung den Median der bis zu sechs nächstgelegenen Messwerte als lokale Referenz. Die Werte werden auf ein 20-Meter-Analyseraster interpoliert. Der Schwellwert des Schiebereglers markiert alle ausgewerteten Zellen rot als Hindernis, deren absolute Abweichung von dieser Referenz größer oder gleich dem gewählten Wert ist; Zellen innerhalb der Toleranz bleiben grün.

Das Raster wird auf `public/data/txl-project-boundary.geojson` zugeschnitten und bleibt im gesamten Berlin-TXL-Projektgebiet sichtbar. Höhentoleranzen und die rot-grüne Einfärbung werden nur für Rasterzellen berechnet, deren Mittelpunkt innerhalb des Teilraums „Landschaftsraum“ (Tegeler Stadtheide) aus `public/data/txl-project-areas.geojson` liegt; die übrigen TXL-Zellen erscheinen als neutrales Raster ohne berechnete Werte. Beide Grenzdateien stammen aus dem amtlichen Berliner WFS-Datensatz „Berlin TXL“ und wurden für die Darstellung im Browser vereinfacht. Quelle der Grenzen: Tegel Projekt GmbH / Berlin TXL, lizenziert unter CC BY 4.0.

## Baumkronen

Die Kronenebene liest `public/data/baeume.geojson` und zeigt die einzeln erkannten Bäume der Waldfläche im Westen des Landschaftsraums. Die Daten stammen aus einer Drohnenbefliegung vom Juli 2026 mit einem DJI Zenmuse L1 (LiDAR und RGB-Kamera). Aus der Punktwolke wurde ein Kronenhöhenmodell gerechnet, daraus die einzelnen Baumspitzen abgeleitet und die Kronen voneinander abgegrenzt; die Farbwerte stammen aus dem zugehörigen Orthofoto mit 2 cm Auflösung. Die vollständige Auswertung ist im zugehörigen Notebook samt Anleitung dokumentiert.

Jede Krone trägt diese Eigenschaften:


| Feld         | Bedeutung                                                             |
| ------------ | --------------------------------------------------------------------- |
| `id`         | laufende Nummer des Baums                                             |
| `hoehe_m`    | Baumhöhe über Grund in Metern                                         |
| `durchm_m`   | Kronendurchmesser in Metern (flächengleicher Kreis)                   |
| `gcc`        | Grünanteil der Krone, `G / (R + G + B)`                               |
| `z`          | Abweichung des Grünanteils vom Bestandsmedian in Standardabweichungen |
| `auffaellig` | wahr, wenn `z < −2`                                                   |
| `farbe`      | vorberechneter Farbwert (wird von der Karte derzeit nicht genutzt)    |


Ein Klick öffnet ein Popup mit den Messwerten des Baums.

Die Markierung als auffällig ist eine relative Aussage: Betroffen sind Kronen, die deutlich weniger grün sind als der übrige Bestand derselben Fläche. Das ist ein Hinweis für eine genauere Betrachtung, keine Diagnose – dunkle Nadelbäume und stark verschattete Kronen können ebenfalls darunterfallen, und die Ursache einer echten Schwächung lässt sich nur vor Ort klären.

## Projektstruktur

- `index.html` – Vites Einstiegsseite im Projektwurzelverzeichnis
- `src/main.js` – schlanker Anwendungsstart, der die Module verbindet
- `src/config.js` – gemeinsame Konfiguration für Karte, Kamera, Grenzen und Overlays
- `src/basemap-controller.js` – Umschaltung zwischen Straßen- und Satellitenkarte sowie Luftbildebene
- `src/map-controller.js` – Kartenansichten, Marker, 2D/3D-Steuerung, Ortsauswahl und Baumkronenebene
- `src/ground-height-analysis.js` – CSV-Auswertung, Interpolation und Zuschnitt auf die Projektgrenze
- `src/ground-height-overlay.js` – MapLibre-Ebenen, Regleraktualisierung, Zählungen und Popups
- `src/project-areas-overlay.js` – amtliche WFS-Projektgebietsebenen und deren Sichtbarkeit
- `src/localization.js` – Sprachauswahl und dynamische Übersetzung der Oberfläche
- `src/i18n.js` – englische, deutsche und französische Oberflächenübersetzungen
- `src/style.css` – Kartenlayout und responsive Gestaltung
- `public/data/txl-ground-heights.csv` – austauschbare Bodenhöhen-Eingabedatei (derzeit Beispieldaten)
- `public/data/txl-project-boundary.geojson` – vereinfachte amtliche Berlin-TXL-Projektgrenze
- `public/data/txl-project-areas.geojson` – vereinfachte amtliche Projektgebietsgrenzen
- `public/data/baeume.geojson` – Kronenpolygone der Einzelbaumerkennung mit Höhe, Durchmesser und Grünanteil
- `dist/` – erzeugter Produktionsbuild

