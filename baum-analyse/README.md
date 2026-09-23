# Einzelbaumerkennung und Vitalitätsscreening aus Drohnen-LiDAR und Orthofoto

Diese Anleitung beschreibt Schritt für Schritt, wie wir aus einer LiDAR-Punktwolke und einem Orthofoto die Bäume einer Waldfläche automatisch erkannt, gezählt, vermessen und auf auffällige Kronen hin untersucht haben. Zu jedem Schritt steht dabei, *warum* wir ihn so gemacht haben, damit ihr die Entscheidungen nachvollziehen und bei anderen Daten anpassen könnt.

---

## Inhalt

1. [Ziel und Grundidee](#1-ziel-und-grundidee)
2. [Die Ausgangsdaten und ihre Formate](#2-die-ausgangsdaten-und-ihre-formate)
3. [Software einrichten](#3-software-einrichten)
4. [Daten inspizieren](#4-daten-inspizieren)
5. [Punktwolke umprojizieren und ausdünnen](#5-punktwolke-umprojizieren-und-ausdünnen)
6. [Orthofoto umprojizieren](#6-orthofoto-umprojizieren)
7. [Bodenklassifikation prüfen](#7-bodenklassifikation-prüfen)
8. [Gelände- und Oberflächenmodell rechnen](#8-gelände--und-oberflächenmodell-rechnen)
9. [Waldfläche abgrenzen](#9-waldfläche-abgrenzen)
10. [Baumerkennung im Jupyter-Notebook](#10-baumerkennung-im-jupyter-notebook)
11. [Kronen als Polygone exportieren](#11-kronen-als-polygone-exportieren)
12. [Farbwerte pro Krone und auffällige Bäume](#12-farbwerte-pro-krone-und-auffällige-bäume)
13. [Ergebnis validieren](#13-ergebnis-validieren)
14. [Grenzen der Methode](#14-grenzen-der-methode)
15. [Häufige Fehler und Lösungen](#15-häufige-fehler-und-lösungen)

---

## 1. Ziel und Grundidee

Wir wollen drei Fragen beantworten:

- **Wie viele Bäume stehen auf der Fläche?**
- **Wie hoch und wie groß sind sie?**
- **Welche Bäume fallen durch ihre Kronenfarbe als möglicherweise geschwächt auf?**

Die Grundidee: Aus der Punktwolke berechnen wir ein **Kronenhöhenmodell** (Canopy Height Model, CHM), also für jeden Punkt der Fläche die Höhe der Vegetation über dem Boden. In diesem Höhenbild ist jede Baumspitze ein lokaler Gipfel. Diese Gipfel finden wir automatisch, und von ihnen ausgehend grenzen wir die Kronen ab. Anschließend legen wir die Kronenumrisse über das Orthofoto und messen pro Krone die Farbe.

**Warum Höhe statt nur Bild?** Benachbarte Kronen haben im Foto oft fast dieselbe Farbe und verschmelzen optisch. In der Höhe sind sie dagegen durch eine Senke getrennt. Das Höhenmodell trennt Bäume deshalb deutlich zuverlässiger. Das Foto brauchen wir erst für die Farbauswertung.

---

## 2. Die Ausgangsdaten und ihre Formate

```
202606026_GB_Wald/
├── pointcloud/
│   └── cloud0.las
└── geotiff/
    └── geotiff/
        ├── dom.tif
        ├── dom.prj
        └── dom.tfw
```

### `.las` – die Punktwolke

Ein standardisiertes Binärformat für 3D-Punktwolken. Jeder Punkt hat X, Y, Z sowie Zusatzinformationen: Intensität des Laserechos, Echonummer, Klassifikation (Boden, Vegetation usw.), Zeitstempel und in unserem Fall auch eine RGB-Farbe. `.laz` ist die komprimierte Variante, `.copc.laz` eine komprimierte Variante mit eingebautem räumlichem Index, die sich besonders schnell anzeigen und auslesen lässt.

### `.tif` – das Rasterbild

Ein GeoTIFF: ein Pixelbild mit Ortsbezug. Achtung, der Name `dom` ist irreführend. Man könnte „Digitales Oberflächenmodell" vermuten, tatsächlich steht es in der DJI-Software für **Digital Orthophoto Map**, also ein entzerrtes Luftbild. Erkennbar ist das an den vier Kanälen im 8-Bit-Format (Rot, Grün, Blau und ein Transparenzkanal). Ein Höhenmodell hätte einen einzigen Kanal mit Kommazahlen.

### `.prj` und `.tfw` – Beiwerk zum Bild

- **`.prj`** enthält das Koordinatensystem als lesbaren Text (lässt sich im Editor öffnen).
- **`.tfw`** („World File") enthält sechs Zahlen: Pixelgröße, Rotation und die Koordinate der linken oberen Ecke.

Beide müssen im selben Ordner und mit demselben Dateinamen wie die `.tif` liegen bleiben. Ein echtes GeoTIFF trägt diese Informationen zwar meist auch intern, aber wer die Dateien trennt, riskiert, dass das Bild seinen Ortsbezug verliert.

---

## 3. Software einrichten

Wir arbeiten unter Windows 10 mit folgenden Werkzeugen:

| Werkzeug | Wofür | Bezug |
|---|---|---|
| **QGIS** | Daten anschauen, Polygon zeichnen, Ergebnisse darstellen | qgis.org |
| **OSGeo4W Shell** | Kommandozeile mit PDAL und GDAL | wird mit QGIS installiert, liegt im Startmenü |
| **CloudCompare** | Punktwolke in 3D anschauen, Querschnitte | cloudcompare.org |
| **Python + VS Code** | Baumerkennung im Notebook | python.org, code.visualstudio.com |

### Warum die OSGeo4W Shell?

PDAL (für Punktwolken) und GDAL (für Raster) sind in QGIS bereits enthalten, aber nur in der **OSGeo4W Shell** direkt aufrufbar. In der normalen Windows-Eingabeaufforderung findet Windows die Programme nicht. Alle Befehle mit `pdal` oder `gdal...` in dieser Anleitung laufen deshalb in der OSGeo4W Shell.

### Python-Umgebung

Wir legen eine eigene virtuelle Umgebung an, damit die Pakete sauber getrennt von der Python-Installation von QGIS bleiben:

```
python -m venv <PROJEKT>\venv
<PROJEKT>\venv\Scripts\activate
pip install rasterio scipy scikit-image geopandas matplotlib ipykernel
```

`<PROJEKT>` ist in dieser gesamten Anleitung der Platzhalter für euren Projektordner, z. B. `D:\Users\name\projekte\SummerSchool\202606026_GB_Wald`. Bitte überall durch euren eigenen Pfad ersetzen.

In VS Code die Jupyter-Erweiterung installieren und beim Notebook oben rechts diese `venv` als Kernel auswählen.

**Wichtig: nicht `pip install gdal` ausführen.** Das Python-Paket `gdal` ist nur eine Hülle um eine C++-Bibliothek und versucht, sich beim Installieren selbst zu kompilieren. Unter Windows scheitert das fast immer mit `Failed building wheel for gdal`. Wir brauchen es auch nicht: `rasterio` bringt GDAL bereits fertig kompiliert mit, und die Kommandozeilenwerkzeuge nutzen wir aus der OSGeo4W Shell.

---

## 4. Daten inspizieren

Bevor man irgendetwas rechnet, muss man wissen, was in den Dateien steckt. Viele spätere Entscheidungen hängen davon ab.

### Orthofoto

In QGIS die `dom.tif` in die Karte ziehen, Rechtsklick → Eigenschaften → Information.

Was wir dort gefunden haben:

| Angabe | Wert | Bedeutung |
|---|---|---|
| Kanäle | 4, Byte | RGB + Transparenz, also Orthofoto |
| Kanal 4 | Mittelwert 254,4 | Transparenzmaske, **kein** Nahinfrarot |
| Pixelgröße | ca. 2,8·10⁻⁷ × 1,7·10⁻⁷ Grad | umgerechnet rund **1,9 cm** |
| Ausdehnung | ca. 786 × 376 m | davon nur 39 % mit gültigen Daten |
| KBS | EPSG:4326 (WGS 84) | geographische Koordinaten in Grad |

### Punktwolke

In der OSGeo4W Shell:

```
pdal info --summary <PROJEKT>\pointcloud\cloud0.las
```

Ergebnis:

| Angabe | Wert | Bedeutung |
|---|---|---|
| Punkte | 255,9 Mio. | sehr große Datei (8,7 GB) |
| Ausdehnung | ca. 660 × 313 m | liegt vollständig im Orthofoto |
| Punktdichte | ca. 1.240 Punkte/m² | weit mehr als nötig |
| Dimensionen | u. a. Classification, ReturnNumber, RGB | Farbe und Echoinformation vorhanden |
| KBS | WGS 84 + EGM96 height | horizontal in Grad, Höhe in Metern |
| System-ID | Base64, entschlüsselt „DJI-L1" | aufgenommen mit DJI Zenmuse L1, echtes LiDAR |

Dann die Klassifikation und die Echos:

```
pdal info --stats --dimensions "Classification,NumberOfReturns,ReturnNumber" <PROJEKT>\pointcloud\cloud0.las
```

Das liest die gesamte Datei und dauert einige Minuten. Ergebnis:

- **NumberOfReturns** im Mittel 1,5, maximal 7: Der Laser dringt durch Lücken im Kronendach bis zum Boden. Damit haben wir auch unter den Bäumen Bodenpunkte.
- **Classification** nur Werte 1 und 2: Die DJI-Software hat bereits Bodenpunkte (Klasse 2) markiert. Knapp 50 % aller Punkte sind Boden.

### Warum diese Befunde wichtig sind

**Die Koordinaten sind in Grad.** Fast alle Verfahren zur Baumerkennung rechnen mit Abständen in Metern (z. B. „Suchfenster 2 m"). In Grad ist ein Schritt nach Osten ein anderer Abstand als ein Schritt nach Norden, und beides passt nicht zur Höhe in Metern. Deshalb müssen wir alles in ein metrisches System umrechnen (Schritt 5 und 6).

**Die Dichte ist viel zu hoch.** Für ein Höhenmodell mit 25 cm Rasterweite reichen 20 bis 50 Punkte pro Quadratmeter. Mit über 1.000 wird jede Berechnung unnötig langsam oder läuft gar nicht erst, weil der Arbeitsspeicher nicht reicht.

**50 % Bodenpunkte sind für einen Sommerwald ungewöhnlich viel.** Normal wären 5 bis 20 %. Bei uns erklärt es sich dadurch, dass die Fläche an einen Flugplatz grenzt und Rollfeld, Taxiways und eine Straße mit erfasst sind. Dort trifft praktisch jeder Laserimpuls den Boden. Trotzdem sollte man so eine Auffälligkeit immer prüfen, statt sie hinzunehmen (Schritt 7).

**Kein Nahinfrarot.** Klassische Vegetationsindizes wie NDVI sind damit nicht möglich. Die Vitalitätsbeurteilung bleibt auf sichtbare Farbveränderungen beschränkt.

---

## 5. Punktwolke umprojizieren und ausdünnen

Wir erledigen zwei Dinge in einem Durchgang: Umrechnung nach **EPSG:25833** (ETRS89 / UTM Zone 33N, das amtliche metrische System für Berlin und Ostdeutschland) und Reduktion auf jeden 20. Punkt.

Datei `prep.json` im Projektordner anlegen (oder bei der bei GitHub bereitgestellten Datei den Dateipfad anpassen und in den Projektordner verschieben):

```json
[
  {
    "type": "readers.las",
    "filename": "<PROJEKT>/pointcloud/cloud0.las",
    "spatialreference": "EPSG:4326"
  },
  {
    "type": "filters.reprojection",
    "in_srs": "EPSG:4326",
    "out_srs": "EPSG:25833"
  },
  {
    "type": "filters.decimation",
    "step": 20
  },
  {
    "type": "writers.copc",
    "filename": "<PROJEKT>/pointcloud/wald_utm33.copc.laz"
  }
]
```

Hinweise:
- In JSON-Dateien die Pfade mit normalen Schrägstrichen `/` schreiben, nicht mit `\`, und immer als vollständigen Pfad.
- Beim Speichern mit dem Windows-Editor darauf achten, dass nicht `prep.json.txt` entsteht (Dateityp „Alle Dateien" wählen). Besser VS Code nehmen.

Ausführen in der OSGeo4W Shell:

```
cd /d <PROJEKT>
pdal pipeline prep.json
```

Das `/d` ist nötig, weil `cd` unter Windows sonst nicht das Laufwerk wechselt. Die Berechnung dauert 10 bis 30 Minuten und zeigt keinen Fortschritt an. Das ist normal. Ob es läuft, sieht man daran, dass die Zieldatei im Explorer wächst.

### Warum machen wir das so?

**`spatialreference` und `in_srs` auf EPSG:4326 statt auf das Originalsystem:** Die Datei nennt ein zusammengesetztes System aus WGS 84 und dem Höhenbezug EGM96. Würden wir das übernehmen, würde PROJ versuchen, ein Geoidmodell herunterzuladen und die Höhen umzurechnen. Das brauchen wir nicht, denn wir rechnen später ohnehin die Höhe *über dem Boden* aus, und dabei fällt der Höhenbezug heraus. So vermeiden wir eine unnötige Fehlerquelle.

**`filters.decimation` statt `filters.sample`:** `filters.sample` würde gleichmäßiger ausdünnen, baut dafür aber einen Suchbaum über alle 256 Mio. Punkte auf und braucht dafür mehr Arbeitsspeicher, als ein normaler Rechner hat. `decimation` nimmt einfach jeden 20. Punkt. Da die Punkte in Aufnahmereihenfolge gespeichert sind, verteilt sich das räumlich gleichmäßig genug. Übrig bleiben rund 12,8 Mio. Punkte, etwa 60 pro Quadratmeter.

**COPC als Ausgabeformat:** komprimiert (aus 8,7 GB werden ca. 200 MB) und mit räumlichem Index, sodass QGIS die Wolke flüssig darstellen kann.

### Kontrolle

```
pdal info --summary <PROJEKT>\pointcloud\wald_utm33.copc.laz
```

Die Grenzen (`bounds`) müssen jetzt sechs- bzw. siebenstellige Meterwerte zeigen: Rechtswerte um 380.000, Hochwerte um 5.825.000. Stehen dort noch Werte wie 13,25, hat die Umprojektion nicht funktioniert.

---

## 6. Orthofoto umprojizieren

Damit Kronenumrisse und Foto später deckungsgleich übereinanderliegen, muss auch das Bild ins selbe System. In der OSGeo4W Shell im Projektordner (als **eine** Zeile):

```
gdalwarp -t_srs EPSG:25833 -tr 0.02 0.02 -r bilinear -co COMPRESS=DEFLATE -co TILED=YES -co BIGTIFF=YES geotiff\geotiff\dom.tif geotiff\geotiff\dom_utm33.tif
```

Bedeutung der Optionen:

| Option | Bedeutung |
|---|---|
| `-t_srs EPSG:25833` | Zielkoordinatensystem |
| `-tr 0.02 0.02` | Zielauflösung 2 cm, passend zur Originalauflösung |
| `-r bilinear` | Interpolation beim Umrechnen der Pixel, glatter als nächster Nachbar |
| `COMPRESS=DEFLATE` | verlustfreie Kompression |
| `TILED=YES` | Datei in Kacheln organisiert, damit Ausschnitte schnell gelesen werden können |
| `BIGTIFF=YES` | nötig, weil die Datei größer als 4 GB werden kann |

Zusätzlich lohnt es sich, in QGIS für das neue Bild Pyramiden anzulegen (Eigenschaften → Pyramiden). Dann bleibt das Zoomen flüssig.

---

## 7. Bodenklassifikation prüfen

Da die Bodenpunkte von der DJI-Software automatisch klassifiziert wurden, prüfen wir, ob wir uns darauf verlassen können.

1. `wald_utm33.copc.laz` in **CloudCompare** öffnen.
2. Als Einfärbung das Skalarfeld **Classification** wählen.
3. Mit dem **Cross Section**-Werkzeug einen etwa 5 m breiten Streifen quer durch den Wald ausschneiden.
4. In der Seitenansicht prüfen: Liegen die Bodenpunkte als dünne Schicht unten? Oder ziehen sie sich bis in die Kronen?

Bei uns lag der Boden sauber unten, und der hohe Bodenanteil erklärt sich durch das Flugfeld. Wir übernehmen die Klassifikation also.

**Warum dieser Schritt wichtig ist:** Wenn fälschlich Bodenvegetation oder tiefe Kronenteile als Boden markiert sind, liegt das Geländemodell zu hoch. Dann werden *alle* Bäume systematisch zu niedrig berechnet, ohne dass man es am Ergebnis sieht. Wäre die Klassifikation schlecht gewesen, hätten wir sie verworfen und den Boden selbst berechnet (z. B. mit PDALs `filters.smrf` oder `filters.csf`).

---

## 8. Gelände- und Oberflächenmodell rechnen

Wir erzeugen zwei Raster mit 25 cm Auflösung:

- **DTM** (Digital Terrain Model): Höhe des Bodens, nur aus Bodenpunkten
- **DSM** (Digital Surface Model): Höhe der obersten Oberfläche, aus allen Punkten

Die Differenz DSM − DTM ist das Kronenhöhenmodell.

`dtm.json`:

```json
[
  {"type": "readers.copc", "filename": "<PROJEKT>/pointcloud/wald_utm33.copc.laz"},
  {"type": "filters.range", "limits": "Classification[2:2]"},
  {"type": "writers.gdal", "filename": "<PROJEKT>/dtm.tif",
   "resolution": 0.25, "output_type": "idw", "window_size": 8}
]
```

`dsm.json`:

```json
[
  {"type": "readers.copc", "filename": "<PROJEKT>/pointcloud/wald_utm33.copc.laz"},
  {"type": "writers.gdal", "filename": "<PROJEKT>/dsm.tif",
   "resolution": 0.25, "output_type": "max", "window_size": 4}
]
```

Ausführen:

```
pdal pipeline dtm.json
pdal pipeline dsm.json
```

### Warum machen wir das so?

**`output_type: idw` beim DTM:** Unter dichten Kronen gibt es nur wenige Bodenpunkte. Die inverse Distanzgewichtung mittelt die vorhandenen Punkte sinnvoll, statt einzelne Ausreißer zu übernehmen.

**`output_type: max` beim DSM:** Uns interessiert die oberste Oberfläche, also die Baumkrone und nicht Äste darunter.

**`window_size`:** Füllt Pixel ohne Punkte durch Interpolation aus der Nachbarschaft. Beim DTM größer, weil unter Bäumen größere Lücken auftreten.

**Warum PDAL statt Python?** PDAL verarbeitet Punktwolken sehr effizient. Wenn wir die Rasterung dort erledigen, brauchen wir in Python keine Punktwolkenbibliothek, sondern arbeiten nur noch mit Bildern. Weil beide Pipelines dieselbe Punktwolke lesen, liegen DTM und DSM automatisch exakt auf demselben Raster und können direkt voneinander abgezogen werden.

---

## 9. Waldfläche abgrenzen

Da Rollfeld und Straße mit erfasst sind, grenzen wir den eigentlichen Wald per Hand ab.

1. In QGIS: Layer → Layer erstellen → **Neuer GeoPackage-Layer**.
2. Im Feld **Datenbank (bzw. Dateiname)** über die drei Punkte rechts den Speicherort wählen: `<PROJEKT>\wald_polygon.gpkg`.
   Achtung: Das Feld „Tabellenname" ist nur der Layername *innerhalb* der Datei. Wer nur das ausfüllt, speichert oft in einem unerwarteten Ordner.
3. Geometrietyp **Polygon**, KBS **EPSG:25833**.
4. Bearbeitungsmodus einschalten (Stiftsymbol), mit dem Orthofoto (`dom_utm33.tif`) im Hintergrund ein Polygon um den Wald zeichnen, mit Rechtsklick abschließen, Bearbeitung speichern.

**Warum großzügig zeichnen?** Das Polygon sollte ein paar Meter über den Waldrand hinausgehen. Sonst werden Randbäume angeschnitten oder fallen heraus.

**Warum überhaupt?** Einerseits für die Angabe „Bäume pro Hektar", für die man die echte Waldfläche braucht. Andererseits, um Büsche und Einzelbäume am Rand des Flugfelds (Nachbargrundstück) auszuschließen.

---

## 10. Baumerkennung im Jupyter-Notebook

Die Notebook datei ist auf GitHub unter dem Namen `baum_erkennung+gesundheit.ipynb` zu finden. Du kannst dir aber auch mit den folgenden Beschreibungen dein eigenes aufbauen.

### Warum ein Notebook?

In dieser Phase probiert man Parameter aus und schaut sich das Ergebnis an. Im Notebook lädt man die Daten einmal und führt danach nur die Zelle mit der Baumerkennung erneut aus. Die Kontrollbilder erscheinen direkt darunter. Wenn die Parameter feststehen, könnte man den Ablauf in ein `.py`-Skript überführen.

### Zelle 1: Imports und Pfade

```python
import numpy as np
import rasterio
import geopandas as gpd
import matplotlib.pyplot as plt
from scipy import ndimage
from skimage.segmentation import watershed

base = "<PROJEKT>/"   # mit Schrägstrichen, abschließendes / nicht vergessen
```

### Zelle 2: Kronenhöhenmodell berechnen (einmal ausführen)

```python
with rasterio.open(base + "dsm.tif") as s, rasterio.open(base + "dtm.tif") as t:
    prof = s.profile
    chm = s.read(1).astype("float32") - t.read(1).astype("float32")

chm[~np.isfinite(chm)] = 0
chm[(chm < 2) | (chm > 45)] = 0           # Boden, Gras, Rollbahn, Ausreißer entfernen
chm = ndimage.median_filter(chm, size=5)  # glätten
```

Warum:
- **Alles unter 2 m entfernen:** Gras, Sträucher, Rollbahn und Unterwuchs sollen nicht als Bäume erkannt werden.
- **Alles über 45 m entfernen:** Die höchsten Punkte der Wolke liegen knapp 29 m über dem tiefsten. Werte darüber sind Messrauschen (z. B. Vögel, Fehlechos).
- **Medianfilter:** Eine Baumkrone ist im Höhenmodell nicht glatt, sondern hat viele kleine Spitzen durch einzelne Äste. Ohne Glättung würde jede davon als eigener Baum erkannt.

### Zelle 3: Baumspitzen und Kronen (diese Zelle wiederholt man beim Einstellen)

```python
win = 7   # Fenstergröße in Pixeln; 7 × 25 cm ≈ 1,75 m

mx = ndimage.maximum_filter(chm, size=win)
tops = (chm == mx) & (chm > 5)
labels, n = ndimage.label(tops)
print(f"{n} Bäume gefunden")

crowns = watershed(-chm, markers=labels, mask=chm > 2)
```

Was hier passiert:
- **Lokale Maxima:** Ein Pixel gilt als Baumspitze, wenn es in seinem Fenster der höchste Punkt ist und über 5 m liegt (damit Büsche nicht mitgezählt werden).
- **Watershed (Wasserscheide):** Man stellt sich das umgedrehte Höhenmodell als Landschaft vor, die von den Baumspitzen aus „geflutet" wird. Wo sich die Wasser zweier Spitzen treffen, verläuft die Kronengrenze.

**Der Parameter `win` ist der wichtigste Stellhebel.** Er legt fest, wie weit zwei Spitzen mindestens auseinanderliegen müssen, um als zwei Bäume zu gelten.

- Zu klein: Eine große Krone zerfällt in mehrere „Bäume".
- Zu groß: Nachbarbäume verschmelzen zu einem.

Bei unserem Bestand hat **`win = 7`** das beste Ergebnis geliefert. Bei anderen Beständen (z. B. schmale Kiefern vs. breite Buchen) kann ein anderer Wert besser passen.

### Zelle 4: Kontrollbild

```python
r0, r1, c0, c1 = 400, 800, 400, 800   # Ausschnitt in Pixeln = 100 × 100 m
ys, xs = np.nonzero(tops[r0:r1, c0:c1])

fig, ax = plt.subplots(figsize=(10, 10))
ax.imshow(chm[r0:r1, c0:c1], cmap="viridis")
ax.scatter(xs, ys, c="red", s=8)
ax.set_title(f"win={win}, {n} Bäume gesamt")
plt.show()
```

Die Ausschnittskoordinaten so verschieben, dass man im Wald und nicht auf dem Flugfeld landet. **Sitzt jeder rote Punkt auf genau einer Krone, passt `win`.** Am besten mehrere Ausschnitte an unterschiedlichen Stellen des Bestands anschauen.

---

## 11. Kronen als Polygone exportieren

Bisher sind die Kronen nur ein Bild mit Nummern. Für die weitere Auswertung und für QGIS wandeln wir sie in Polygone mit Attributen um.

```python
from rasterio.mask import mask as rmask

rows = []
with rasterio.open(base + "geotiff/geotiff/dom_utm33.tif") as src:
    for geom in gdf.geometry:
        inner = geom.buffer(-0.3)
        if inner.is_empty:
            rows.append((np.nan,) * 4); continue
        arr, _ = rmask(src, [inner], crop=True, filled=False)
        m = np.ma.getmaskarray(arr).any(axis=0)          # gemeinsame Maske ueber alle Kanaele
        r, g, b, a = [band.data[~m].astype("float32") for band in arr]
        ok = (a > 0) & ((r + g + b) > 90)
        if ok.sum() < 50:
            rows.append((np.nan,) * 4); continue
        r, g, b = r[ok], g[ok], b[ok]
        s = r + g + b
        rows.append((r.mean(), g.mean(), b.mean(), np.median(g / s)))

gdf[["R", "G", "B", "gcc"]] = rows
```

Warum:
- **`dissolve`:** Hängt eine Krone nur über ein einzelnes Pixel zusammen, erzeugt die Vektorisierung zwei Teilflächen. `dissolve` fasst alles mit derselben Nummer wieder zu einem Baum zusammen.
- **Höhe** = höchster Wert im Kronenhöhenmodell innerhalb der Krone.
- **Durchmesser** = Durchmesser eines Kreises mit gleicher Fläche. Eine Näherung, aber für Vergleiche gut brauchbar.

### Auf den Wald zuschneiden

```python
wald = gpd.read_file(base + "wald_polygon.gpkg").to_crs(25833)
gdf = gdf[gdf.centroid.within(wald.union_all())].copy()
print(f"{len(gdf)} Bäume im Wald, {len(gdf) / (wald.area.sum() / 10000):.0f} pro ha")
```

**Warum über den Mittelpunkt?** Würde man die Polygone am Waldrand abschneiden, entstünden halbe Kronen mit falscher Fläche. Über den Mittelpunkt bleibt jeder Baum entweder ganz drin oder ganz draußen.

---

## 12. Farbwerte pro Krone und auffällige Bäume

Jetzt legen wir die Kronen über das Orthofoto und messen pro Baum die Farbe.

```python
from rasterio.mask import mask as rmask

rows = []
with rasterio.open(base + "geotiff/geotiff/dom_utm33.tif") as src:
    for geom in gdf.geometry:
        inner = geom.buffer(-0.3)
        if inner.is_empty:
            rows.append((np.nan,) * 4); continue
        arr, _ = rmask(src, [inner], crop=True, filled=False)
        r, g, b, a = [x.compressed().astype("float32") for x in arr]
        ok = (a > 0) & ((r + g + b) > 90)
        if ok.sum() < 50:
            rows.append((np.nan,) * 4); continue
        r, g, b = r[ok], g[ok], b[ok]
        s = r + g + b
        rows.append((r.mean(), g.mean(), b.mean(), np.median(g / s)))

gdf[["R", "G", "B", "gcc"]] = rows
```

Warum:
- **Kronenweise lesen:** Das Orthofoto ist mehrere GB groß. Wir lesen immer nur den kleinen Ausschnitt einer Krone, so bleibt der Speicherbedarf gering.
- **Negativer Puffer von 30 cm:** Am Rand einer Krone mischen sich Nachbarkrone und Waldboden ins Bild. Wir messen nur im Inneren.
- **Transparenz und Schatten ausschließen:** Pixel mit Alpha 0 liegen außerhalb des Bildes. Sehr dunkle Pixel (Helligkeitssumme unter 90) sind Schatten und würden gesunde Bäume dunkel und damit „krank" erscheinen lassen.
- **Median statt Mittelwert beim GCC:** robuster gegen einzelne Ausreißerpixel.

### Was ist der GCC?

Der **Green Chromatic Coordinate** ist der Anteil von Grün an der Gesamthelligkeit: `G / (R + G + B)`. Er ist aussagekräftiger als die reinen Farbwerte, weil Helligkeitsunterschiede (Sonne, Wolke, Sonnenstand) weitgehend herausfallen. Vitale Kronen liegen typischerweise über ca. 0,38, braune oder vergraute Kronen darunter.

### Auffällige Bäume markieren

```python
z = (gdf["gcc"] - gdf["gcc"].median()) / gdf["gcc"].std()
gdf["auffaellig"] = z < -2

gdf.to_file(base + "baeume.gpkg", driver="GPKG")
print(gdf["auffaellig"].sum(), "auffällige Kronen")
```

**Warum relativ statt mit festem Grenzwert?** Verschiedene Baumarten haben von Natur aus unterschiedliche Farben, und wir kennen die Arten nicht. Deshalb vergleichen wir jeden Baum mit dem Bestand: Als auffällig gilt, wer mehr als zwei Standardabweichungen weniger grün ist als der typische Baum der Fläche.

### Ergebnis anschauen

`baeume.gpkg` in QGIS über `dom_utm33.tif` laden, Symbolisierung auf **Abgestuft** nach `gcc`. Die markierten Bäume einzeln im Orthofoto begutachten.

Ein Teil davon werden echte Schäden sein (Totholz, verbräunte Kronen), ein Teil Fehlalarme, z. B. Nadelbäume, die generell dunkler sind, oder stark verschattete Kronen. Die Auswertung ist ein Filter, der aus Tausenden Bäumen die wenigen heraussucht, die man sich genauer ansehen sollte, keine fertige Diagnose.

Bei gemischten Beständen kann es sinnvoll sein, die Z-Werte getrennt für Nadel- und Laubbäume zu berechnen, damit nicht überproportional viele Nadelbäume als auffällig gelten.

---

## 13. Ergebnis validieren

Dass `win = 7` „am besten aussieht", ist ein guter Anfang, aber noch keine belastbare Aussage. Dafür zählen wir in einer Stichprobe von Hand nach.

1. Zwei bis drei Ausschnitte von je etwa einem halben Hektar wählen, möglichst in unterschiedlichen Bestandsteilen (dicht, locker, Waldrand).
2. Im Orthofoto (evtl. mit dem CHM als Hilfe) jeden Baum per Hand als Punkt markieren.
3. Mit den automatisch erkannten Baumspitzen vergleichen und zählen:
   - **TP** (richtig erkannt): Baum vorhanden und gefunden
   - **FN** (übersehen): Baum vorhanden, aber nicht gefunden
   - **FP** (Fehldetektion): gefunden, aber kein eigener Baum

Daraus:

- **Precision** = TP / (TP + FP): Wie viele der gefundenen Bäume sind echt?
- **Recall** = TP / (TP + FN): Wie viele der echten Bäume wurden gefunden?
- **F1** = 2 · Precision · Recall / (Precision + Recall): Gesamtmaß

Erst damit wird aus „der Algorithmus hat X Bäume gezählt" eine Aussage mit bekannter Fehlerquote.

---

## 14. Grenzen der Methode

- **Unterstand ist unsichtbar.** Kleinere Bäume unter dem Kronendach erfasst weder das Foto noch (zuverlässig) der Laser. Die Zählung bezieht sich auf die Bäume der oberen Kronenschicht.
- **Dichte Laubbestände** mit ineinander verwachsenen Kronen werden schlechter getrennt als lockere Bestände oder Nadelwald.
- **Kein Nahinfrarot:** Mit reinen RGB-Daten erkennt man vor allem sichtbare, also eher fortgeschrittene Schäden. Beginnender Trockenstress ist so kaum zu erkennen. Dafür bräuchte man Multispektral- oder Thermalaufnahmen.
- **Nur ein Aufnahmezeitpunkt** (Juli 2026): Wir können Bäume nur untereinander vergleichen, nicht mit ihrem eigenen früheren Zustand. Eine Wiederholungsbefliegung würde die Aussagekraft deutlich erhöhen.
- **Farbe ist unspezifisch:** Trockenheit, Schädlinge, Pilze oder Wurzelschäden sehen aus der Luft ähnlich aus. Die Ursache muss vor Ort geklärt werden.
- **Keine Artbestimmung:** Dafür bräuchte es zusätzliche Spektralinformation und im Gelände bestimmte Referenzbäume als Trainingsdaten.

---

## 15. Häufige Fehler und Lösungen

| Problem | Ursache | Lösung |
|---|---|---|
| `Failed building wheel for gdal` | `pip install gdal` versucht, C++-Code zu kompilieren | nicht nötig: `rasterio` verwenden, GDAL-Befehle in der OSGeo4W Shell |
| `pdal` oder `gdalwarp` nicht gefunden | normale Eingabeaufforderung statt OSGeo4W Shell | OSGeo4W Shell aus dem Startmenü öffnen |
| „Das System kann den angegebenen Pfad nicht finden" bei `cd` | Laufwerkswechsel ohne `/d`, oder zwei Befehle beim Kopieren zu einer Zeile verschmolzen | `cd /d ...` verwenden; Befehle einzeln eingeben |
| PDAL scheint zu hängen | PDAL zeigt keinen Fortschritt | Zieldatei im Explorer beobachten, sie wächst |
| Pipeline findet `prep.json` nicht | Datei heißt in Wahrheit `prep.json.txt` | im Explorer Dateiendungen einblenden, umbenennen |
| QGIS zeigt bei Punktwolkenstatistik überall `nan` | QGIS berechnet die Statistik für große LAS-Dateien nicht | stattdessen `pdal info --stats` verwenden |
| Nach der Umprojektion noch Werte wie 13,25 in den Bounds | Umprojektion hat nicht gegriffen | `in_srs`/`out_srs` in der Pipeline prüfen |
| `ModuleNotFoundError: rasterio` im Notebook | falscher Python-Kernel ausgewählt | in VS Code oben rechts die `venv` als Kernel wählen |
| `DataSourceError: ... wald_polygon.gpkg: No such file or directory` | GeoPackage wurde woanders oder unter anderem Namen gespeichert | in QGIS Rechtsklick auf Layer → Eigenschaften → Information → Pfad nachsehen; oder `glob.glob(base + "**/*.gpkg", recursive=True)` |
| Eine Krone wird als mehrere Bäume erkannt | `win` zu klein | `win` erhöhen (9, 11) |
| Nachbarbäume verschmelzen | `win` zu groß | `win` verringern (5) |

---

## Ergebnisdateien im Überblick

| Datei | Inhalt |
|---|---|
| `pointcloud/wald_utm33.copc.laz` | umprojizierte, ausgedünnte Punktwolke |
| `geotiff/geotiff/dom_utm33.tif` | umprojiziertes Orthofoto |
| `dtm.tif` | Geländemodell, 25 cm |
| `dsm.tif` | Oberflächenmodell, 25 cm |
| `wald_polygon.gpkg` | Abgrenzung der Waldfläche |
| `baeume.gpkg` | ein Polygon pro Baum mit Höhe, Fläche, Durchmesser, Farbwerten, GCC und Auffälligkeits-Markierung |
