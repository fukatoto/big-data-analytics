# Landing im Grünen - Interaktiver Atlas

Studentisches Projekt mit dem CityLAB Berlin, dem LiFo Lab und Grün Berlin.

Der Atlas zeigt das ehemalige Flughafengelände Berlin-Tegel und die heutige Urban Tech Republic in einer interaktiven 3D-Karte. Dazu gehört eine Auswertung von Drohnendaten, die die Bäume des Landschaftsraums Tegeler Stadtheide einzeln erfasst und in die Karte einbindet.

## Aufbau

| Ordner | Inhalt |
|---|---|
| [`website/`](website/) | Die interaktive Karte: Vite, MapLibre GL JS, dreisprachige Oberfläche. Enthält die Anleitung zum lokalen Start und zu den verwendeten Datenquellen. |
| [`baum-analyse/`](baum-analyse/) | Auswertung der Drohnenbefliegung: Einzelbaumerkennung und Vitalitäts-Screening aus LiDAR-Punktwolke und Orthofoto. Enthält das Jupyter-Notebook und eine ausführliche Schritt-für-Schritt-Anleitung. |

Die Baumanalyse erzeugt die Datei `baeume.geojson`, die in der Webseite unter `website/public/data/` als Kartenebene eingebunden ist. Beide Teile lassen sich unabhängig voneinander nutzen.

## Daten und Lizenzen

Die verwendeten Fremddaten und ihre Lizenzen sind in den READMEs der jeweiligen Unterordner dokumentiert, darunter Kartendaten von OpenStreetMap über OpenFreeMap, die Berliner TrueDOP-Orthophotos der Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen sowie die Projektgebietsgrenzen der Tegel Projekt GmbH.
