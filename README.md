# Landing im Grünen - Interaktiver Atlas

Studentisches Projekt mit dem CityLAB Berlin, dem LiFo Lab und Grün Berlin.

Der Atlas zeigt das ehemalige Flughafengelände Berlin-Tegel und die heutige Urban Tech Republic in einer interaktiven 3D-Karte. Dazu gehört eine Auswertung von Drohnendaten, die die Bäume des Landschaftsraums Tegeler Stadtheide einzeln erfasst und in die Karte einbindet. Darüber hinaus sind auf der Karte sehenswerte Orte des Geländes mit Hintergrundinformationen sowie Veranstaltungen und Termine verzeichnet, die dort stattfinden. Eine weitere Ebene markiert Kuhlen und Unebenheiten im Boden, die einem Mähroboter bei der Pflege der Flächen Probleme bereiten könnten.

## Aufbau

| Ordner | Inhalt |
|---|---|
| [`website/`](website/) | Die interaktive Karte: Vite, MapLibre GL JS, dreisprachige Oberfläche. Enthält die Anleitung zum lokalen Start und zu den verwendeten Datenquellen. |
| [`baum-analyse/`](baum-analyse/) | Auswertung der Drohnenbefliegung: Einzelbaumerkennung und Vitalitäts-Screening aus LiDAR-Punktwolke und Orthofoto. Enthält das Jupyter-Notebook und eine ausführliche Schritt-für-Schritt-Anleitung. |

Die Baumanalyse erzeugt die Datei `baeume.geojson`, die in der Webseite unter `website/public/data/` als Kartenebene eingebunden ist. Beide Teile lassen sich unabhängig voneinander nutzen.

## Daten und Lizenzen

Die verwendeten Fremddaten und ihre Lizenzen sind in den READMEs der jeweiligen Unterordner dokumentiert, darunter Kartendaten von OpenStreetMap über OpenFreeMap, die Berliner TrueDOP-Orthophotos der Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen sowie die Projektgebietsgrenzen der Tegel Projekt GmbH.

## Quellen

### Geodaten

- Umrisse und Teilraumpolygone: [Berlin TXL (GovData)](https://www.govdata.de/suche/daten/berlin-txl)
- Satellitenansicht: [Digitale farbige TrueOrthophotos Sommer 2025 (TrueDOP20RGBI), WMS](https://daten.berlin.de/datensaetze/digitale-farbige-trueorthophotos-sommer-2025-truedop20rgbi-wms-d714b73c)
- Drohnenbefliegung des Landschaftsraums Tegeler Stadtheide (LiDAR-Punktwolke und Orthofoto, Juli 2026), bereitgestellt von Grün Berlin. Grundlage der Baumanalyse und der Bodenauswertung. Die Rohdaten sind nicht öffentlich zugänglich und nicht Teil dieses Repositories.

### Inhalte und Termine

- Veranstaltungen: [Kalender Campus Stadt Natur](https://www.campus-stadt-natur.de/angebote-aktionen/kalender)
- Fakten zum Projekt: [Grün Berlin, Jahresbericht 2023 – Tegel](https://gruen-berlin.de/geschaeftsberichte/jahresbericht-2023/projekte/tegel)
- Beweidungszone: [Campus Stadt Natur – Biotope und Beweidung](https://www.campus-stadt-natur.de/parks-erfahrungsraeume/tegeler-stadtheide/biotope-beweidung/)
- Landschaftspflegehof und Landebahnoase: Präsentation `landschaftsraum_tegeler_stadtheide.pdf` (Grün Berlin GmbH)

### Bilder

**Terminal A**
- Bestand, Ralf Roletschek **(nicht in der Anwendung genutzt)**: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:17-05-27-Flughafen_Berlin_TXL-a_RR71292.jpg)
- Bestand, Christian Sommer: [Urban Tech Republic](https://urbantechrepublic.de/wp-content/uploads/elementor/thumbs/TerminalA_ChristianSommer1-r9kiadupxejnp4juw1hv0h12f3pkkl1xg9nvse9qg0.png)
- Konzept, agn Niederberghaus & Partner: [Urban Tech Republic](https://urbantechrepublic.de/wp-content/uploads/elementor/thumbs/TerminalA_agn1-r9kia3ihu85i5eyvkf0yr1mzvv4j7wwvquhjicp2cg.png)

**Terminal B**
- Bestand, Gunnar Klack **(nicht in der Anwendung genutzt)**: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Flughafen-Berlin-Tegel-Hauptgebaeude-Nebelhalle-Terminal-B-02-2018b.jpg)
- Bestand, Gerhard Kassner: [Urban Tech Republic](https://urbantechrepublic.de/wp-content/uploads/elementor/thumbs/TerminalB_GerhardKassner3-r9k76k84vd7v8bbekprrwv7lxsdxfgs85btly93b4w.png)
- Konzept, Chaix et Morel: [Urban Tech Republic](https://urbantechrepublic.de/wp-content/uploads/2022/07/EXT-1-c-chaixemorel_Schuesslerplan_VIZE.jpg)
- Konzept, gmp **(nicht in der Anwendung genutzt)**: [Urban Tech Republic](https://urbantechrepublic.de/wp-content/uploads/elementor/thumbs/TerminalB_gmp2-r9k628xbr615advhzafsz1fwqv37asqnxsjwz0v600.png)

**Terminal D**
- Bestand, Michael F. Mehnert **(nicht in der Anwendung genutzt)**: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:TXL_2008-03-05_Terminal_D.jpg)
- Bestand, Berlin TXL Management GmbH: [Außenansicht](https://urbantechrepublic.de/wp-content/uploads/elementor/thumbs/Terminal_D_Terminalgebaeude_04-r3bpf21fmphrn2zoas9hjg3fg7w31n8hsog261xdls.jpg) · [Innenansicht](https://urbantechrepublic.de/wp-content/uploads/elementor/thumbs/Terminal_D_Terminalgebaeude_01-r3bpf21fmphrn2zoas9hjg3fg7w31n8hsog261xdls.jpg)
- Konzept, GRAFT: [Außenansicht](https://urbantechrepublic.de/wp-content/uploads/elementor/thumbs/TerminalD_Graft4-r9kgl3rid8nosbkbq1wgyfq87rr3qyrwoyjafz4q3k.png) · [Innenansicht](https://urbantechrepublic.de/wp-content/uploads/elementor/thumbs/TerminalD_Graft3-r9kgl1vtzkl453n21137tg7b100dbkkg0p8bhf7ig0.png)

**Landschaftsraum**
- Rundbogenantenne, Bestand, Thomas Rosenthal: [Grün Berlin](https://gruen-berlin.de/fileadmin/_processed_/5/0/csm_gb_projekte_urbanefreiraeume_tegel_flughafensee_richtung_norden_c_thomasrosenthal_f79071f82f.jpg)
- Rundbogenantenne, Konzept, Atelier Loidl: [Grün Berlin](https://gruen-berlin.de/fileadmin/_processed_/8/2/csm_gruenberlin_projekte_urbanefreiraeume_tegel_p03_rundbogenantenne_c_atelierloidl_d6994220d3.jpg)
- Heideblick, Bestand, Thomas Rosenthal: [Grün Berlin](https://gruen-berlin.de/fileadmin/_processed_/3/b/csm_gb_projekte_urbanefreiraeume_tegel_noerdliche_start_landebahn_c_thomasrosenthal_a249fbcd16.jpg)
- Heideblick, Konzept, Atelier Loidl: [Grün Berlin](https://gruen-berlin.de/fileadmin/_processed_/8/8/csm_gruenberlin_projekte_urbanefreiraeume_tegel_p01_heideblick_c_atelierloidl_787c646286.jpg)
- Freizeit in der Natur, Konzept, Atelier Loidl: [Grün Berlin](https://gruen-berlin.de/fileadmin/_processed_/a/b/csm_gruenberlin_projekte_urbanefreiraeume_tegel_p02_delaborierung_neu_c_atelierloidl_026ac19337.jpg)
- Nördliche Landebahn, Konzept, Thomas Rosenthal: [Berlin.de](https://www.berlin.de/imgscale4/ropen/sen/uvk/_assets/natur-gruen/landschaftsplanung/tegeler-stadtheide/upload__b368096a3c2c8fb90b54c12d562e3df2_weidelandschaft-tegler-stadtheide-visualisierung.jpg)
- Südliche Landebahn, Konzept, Atelier Loidl: [Garten + Landschaft](https://www.garten-landschaft.de/wp-content/uploads/2022/06/03-210708-Perspektive-LP3-Blick-ueber-die-noerdliche-Landebahn-Richtung-Nord-West-min-scaled-1.jpg)
- Befeuerungsanlage, Bestand, Thomas Rosenthal: [Grün Berlin](https://gruen-berlin.de/fileadmin/_processed_/8/6/csm_gb_projekte_urbanefreiraeume_tegel_start_landeflaeche_c_thomasrosenthal_a17f094566.jpg)
- Landschaftspark, Konzept, GM013 Landschaftsarchitektur: [GM013](https://cdn.prod.website-files.com/5eb54e4451528b98c8bfe640/5eda332555b72c2ec31c398b_TXL---gm013-_-perspektive-1-web.jpg)
- Schumacher Quartier, Konzept, Berlin TXL Management GmbH: [Schuchmacher Quartier](https://schumacher-quartier.de/wp-content/uploads/2026/07/Visualisierung_SQ_Innenansicht_kleiner_Quartiersplatz_Copyright_Tegel-Projekt-GmbH_rendertaxi_15x10_300dpi_CMYK.jpg)
- Liegewiese, Konzept, Atelier Loidl: [Garten + Landschaft](https://www.garten-landschaft.de/wp-content/uploads/2022/06/02-Perspektive-QP2-Blick-ueber-zentrale-Rasenflaeche-Richtung-Westen-min-1-scaled-2.jpg)
- Zukunftsbaumschule, BAUFACHFRAU Berlin e. V.: Instagram-Beitrag
- Radarstation, Matti Blume: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Airport_Surveillance_Radar,_Tegel_Airport,_Berlin_%28IMG_8942%29.jpg)
- Heidesteg, Atelier Loidl: [gruppe F](https://gruppef.com/wp-content/uploads/2024/03/gruenberlin_projekte_urbanefreiraeume_tegel_vogelperspektive_c_atelierloidl_kleiner-1-1260x840.png)
- Heidetribüne, Atelier Loidl: [gruppe F](https://gruppef.com/wp-content/uploads/2024/03/gruenberlin_projekte_urbanefreiraeume_tegel_p01_heideblick_c_atelierloidl-1260x1063.jpg)
- Beweidungszone, Skudden und Fuchsschafe, Stefan Klenke: [Skudden](https://www.campus-stadt-natur.de/parks-erfahrungsraeume/tegeler-stadtheide/biotope-beweidung/#:~:text=Ostpreu%C3%9Fische%20Skudde) · [Fuchsschafe](https://www.campus-stadt-natur.de/parks-erfahrungsraeume/tegeler-stadtheide/biotope-beweidung/#:~:text=Coburger%20Fuchsschaf)
- Beweidungszone, Rinder und Pferde, Dronebrothers: [Rinder](https://www.campus-stadt-natur.de/parks-erfahrungsraeume/tegeler-stadtheide/biotope-beweidung/#:~:text=Rotes%20H%C3%B6henvieh) · [Pferde](https://www.campus-stadt-natur.de/parks-erfahrungsraeume/tegeler-stadtheide/biotope-beweidung/#:~:text=D%C3%BClmener%20Pferde)
- Landschaftspflegehof, Bestand, Grün Berlin GmbH: Präsentation `landschaftsraum_tegeler_stadtheide.pdf`
- Landebahnoase, Konzept, Atelier Loidl: Präsentation `landschaftsraum_tegeler_stadtheide.pdf`

## Einsatz von KI

Bei der Entwicklung dieses Projekts wurden KI-Assistenten eingesetzt. Um das transparent zu machen, ist hier aufgeführt, wofür und in welchem Umfang:

- **Baumanalyse:** Beratung zur Methodik (Auswahl der Verfahren zur Einzelbaumerkennung, Umgang mit den Rohdatenformaten), Hilfe bei der Erstellung und Fehlersuche des Python-Codes im Notebook sowie der PDAL- und GDAL-Aufrufe. 
- **Webseite:** Generierung einzelner Codebestandteile, Unterstützung beim Einbinden der Baumebene in MapLibre sowie bei der Fehlersuche im JavaScript.
- **Dokumentation:** Entwürfe für die Anleitung zur Baumanalyse, für diese README und für die Erklärtexte im Notebook, außerdem die vereinzelte Übersetzung der Texte ins Englische bzw. ins Französische. Alle Texte wurden inhaltlich geprüft.
