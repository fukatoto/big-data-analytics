# Einzelbaumerkennung und Vitalitätsscreening aus Drohnen-LiDAR und Orthofoto

Diese Anleitung beschreibt Schritt für Schritt, wie sich die Bäume einer Waldfläche anhand einer LiDAR-Punktwolke und eines Orthofotos automatisch erkennen, zählen, vermessen und auf auffällige Kronen hin untersuchen lassen. Zu jedem Schritt wird die Vorgehensweise begründet, damit die Entscheidungen nachvollziehbar und auf andere Daten übertragbar sind.

---

## Inhalt

1. [Ziel und Grundidee](#1-ziel-und-grundidee)
2. [Ausgangsdaten und ihre Formate](#2-ausgangsdaten-und-ihre-formate)
3. [Software einrichten](#3-software-einrichten)
4. [Daten inspizieren](#4-daten-inspizieren)
5. [Punktwolke umprojizieren und ausdünnen](#5-punktwolke-umprojizieren-und-ausdünnen)
6. [Orthofoto umprojizieren](#6-orthofoto-umprojizieren)
7. [Bodenklassifikation prüfen](#7-bodenklassifikation-prüfen)
8. [Gelände- und Oberflächenmodell berechnen](#8-gelände--und-oberflächenmodell-berechnen)
9. [Waldfläche abgrenzen](#9-waldfläche-abgrenzen)
10. [Baumerkennung im Jupyter-Notebook](#10-baumerkennung-im-jupyter-notebook)
11. [Kronen als Polygone exportieren](#11-kronen-als-polygone-exportieren)
12. [Farbwerte pro Krone und auffällige Bäume](#12-farbwerte-pro-krone-und-auffällige-bäume)
13. [Ergebnis validieren](#13-ergebnis-validieren)
14. [Grenzen der Methode](#14-grenzen-der-methode)
15. [Häufige Fehler und Lösungen](#15-häufige-fehler-und-lösungen)

---

## 1. Ziel und Grundidee

Drei Fragen stehen im Mittelpunkt:

- **Wie viele Bäume stehen auf der Fläche?**
- **Wie hoch und wie groß sind sie?**
- **Welche Bäume fallen durch ihre Kronenfarbe als möglicherweise geschwächt auf?**

Die Grundidee: Aus der Punktwolke wird ein **Kronenhöhenmodell** (Canopy Height Model, CHM) berechnet, das für jeden Punkt der Fläche die Höhe der Vegetation über dem Boden angibt. In diesem Höhenbild ist jede Baumspitze ein lokaler Gipfel. Diese Gipfel werden automatisch erkannt und dienen als Ausgangspunkte für die Abgrenzung der Kronen. Anschließend werden die Kronenumrisse über das Orthofoto gelegt und die Farbwerte pro Krone gemessen.

**Warum Höhe statt nur Bild?** Benachbarte Kronen haben im Foto oft fast dieselbe Farbe und verschmelzen optisch. In der Höhe sind sie dagegen durch eine Senke getrennt. Das Höhenmodell trennt Bäume deshalb deutlich zuverlässiger. Das Foto wird erst für die Farbauswertung benötigt.

---

## 2. Ausgangsdaten und ihre Formate

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

Ein standardisiertes Binärformat für 3D-Punktwolken. Jeder Punkt hat X, Y, Z sowie Zusatzinformationen: Intensität des Laserechos, Echonummer, Klassifikation (Boden, Vegetation usw.), Zeitstempel und in den hier verwendeten Daten auch eine RGB-Farbe. `.laz` ist die komprimierte Variante, `.copc.laz` eine komprimierte Variante mit eingebautem räumlichem Index, die sich besonders schnell anzeigen und auslesen lässt.

### `.tif` – das Rasterbild

Ein GeoTIFF: ein Pixelbild mit Ortsbezug. Achtung, der Name `dom` ist irreführend. Man könnte „Digitales Oberflächenmodell“ vermuten, tatsächlich steht es in der DJI-Software für **Digital Orthophoto Map**, also ein entzerrtes Luftbild. Erkennbar ist das an den vier Kanälen im 8-Bit-Format (Rot, Grün, Blau und ein Transparenzkanal). Ein Höhenmodell hätte einen einzigen Kanal mit Kommazahlen.

### `.prj` und `.tfw` – Beiwerk zum Bild

- **`.prj`** enthält das Koordinatensystem als lesbaren Text (lässt sich im Editor öffnen).
- **`.tfw`** („World File“) enthält sechs Zahlen: Pixelgröße, Rotation und die Koordinate der linken oberen Ecke.

Beide müssen im selben Ordner und mit demselben Dateinamen wie die `.tif` liegen bleiben. Ein echtes GeoTIFF trägt diese Informationen zwar meist auch intern, aber wer die Dateien trennt, riskiert, dass das Bild seinen Ortsbezug verliert.

---

## 3. Software einrichten

Für die hier beschriebene Verarbeitung unter Windows 10 werden folgende Werkzeuge verwendet:

| Werkzeug | Einsatzzweck | Bezug |
|---|---|---|
| **QGIS** | Daten betrachten, Polygon zeichnen, Ergebnisse darstellen | qgis.org |
| **OSGeo4W Shell** | Kommandozeile mit PDAL und GDAL | wird mit QGIS installiert, liegt im Startmenü |
| **CloudCompare** | Punktwolke in 3D betrachten, Querschnitte | cloudcompare.org |
| **Python + VS Code** | Baumerkennung im Notebook | python.org, code.visualstudio.com |

### Warum die OSGeo4W Shell?

PDAL (für Punktwolken) und GDAL (für Raster) sind in QGIS bereits enthalten, aber nur in der **OSGeo4W Shell** direkt aufrufbar. In der normalen Windows-Eingabeaufforderung findet Windows die Programme nicht. Alle Befehle mit `pdal` oder `gdal...` in dieser Anleitung laufen deshalb in der OSGeo4W Shell.

### Python-Umgebung

Eine eigene virtuelle Umgebung hält die benötigten Pakete von der Python-Installation von QGIS getrennt:

```
python -m venv <PROJEKT>\venv
<PROJEKT>\venv\Scripts\activate
pip install rasterio scipy scikit-image geopandas matplotlib ipykernel
```

`<PROJEKT>` ist in dieser gesamten Anleitung der Platzhalter für den jeweiligen Projektordner, z. B. `D:\Users\name\projekte\SummerSchool\202606026_GB_Wald`. Der Platzhalter ist in allen Befehlen durch den tatsächlichen Pfad zu ersetzen.

In VS Code die Jupyter-Erweiterung installieren und beim Notebook oben rechts diese `venv` als Kernel auswählen.

**Wichtig: nicht `pip install gdal` ausführen.** Das Python-Paket `gdal` ist nur eine Hülle um eine C++-Bibliothek und versucht, sich beim Installieren selbst zu kompilieren. Unter Windows scheitert das fast immer mit `Failed building wheel for gdal`. Das Paket ist hier nicht erforderlich: `rasterio` bringt GDAL bereits fertig kompiliert mit und die Kommandozeilenwerkzeuge werden aus der OSGeo4W Shell verwendet.

---

## 4. Daten inspizieren

Vor der Verarbeitung sollten Inhalt und Eigenschaften der Dateien geprüft werden. Viele spätere Entscheidungen hängen davon ab.

### Orthofoto

In QGIS die `dom.tif` in die Karte ziehen, Rechtsklick → Eigenschaften → Information.

Für das vorliegende Orthofoto ergaben sich folgende Angaben:

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
| System-ID | Base64, entschlüsselt „DJI-L1“ | aufgenommen mit DJI Zenmuse L1, echtes LiDAR |

Dann die Klassifikation und die Echos:

```
pdal info --stats --dimensions "Classification,NumberOfReturns,ReturnNumber" <PROJEKT>\pointcloud\cloud0.las
```

Dies liest die gesamte Datei und dauert einige Minuten. Ergebnis:

- **NumberOfReturns** im Mittel 1,5, maximal 7: Der Laser dringt durch Lücken im Kronendach bis zum Boden. Damit liegen auch unter den Bäumen Bodenpunkte vor.
- **Classification** nur Werte 1 und 2: Die DJI-Software hat bereits Bodenpunkte (Klasse 2) markiert. Knapp 50 % aller Punkte sind Boden.

### Warum diese Befunde wichtig sind

**Die Koordinaten sind in Grad angegeben.** Fast alle Verfahren zur Baumerkennung rechnen mit Abständen in Metern (z. B. „Suchfenster 2 m“). In Grad ist ein Schritt nach Osten ein anderer Abstand als ein Schritt nach Norden und beides passt nicht zur Höhe in Metern. Deshalb ist eine Umrechnung in ein metrisches System erforderlich (Schritt 5 und 6).

**Die Dichte ist viel zu hoch.** Für ein Höhenmodell mit 25 cm Rasterweite reichen 20 bis 50 Punkte pro Quadratmeter. Bei über 1.000 Punkten pro Quadratmeter werden Berechnungen unnötig langsam oder können wegen unzureichenden Arbeitsspeichers nicht ausgeführt werden.

**50 % Bodenpunkte sind für einen Sommerwald ungewöhnlich viel.** Normal wären 5 bis 20 %. Bei den vorliegenden Daten erklärt sich der hohe Anteil dadurch, dass die Fläche an einen Flugplatz grenzt und Rollfeld, Taxiways und eine Straße mit erfasst sind. Dort trifft praktisch jeder Laserimpuls den Boden. Trotzdem sollte eine solche Auffälligkeit geprüft werden (Schritt 7).

**Kein Nahinfrarot.** Klassische Vegetationsindizes wie NDVI sind damit nicht möglich. Die Vitalitätsbeurteilung bleibt auf sichtbare Farbveränderungen beschränkt.

---

## 5. Punktwolke umprojizieren und ausdünnen

In einem Durchgang erfolgen die Umrechnung nach **EPSG:25833** (ETRS89 / UTM Zone 33N, das amtliche metrische System für Berlin und Ostdeutschland) und die Reduktion auf jeden 20. Punkt.

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
- In JSON-Dateien die Pfade mit normalen Schrägstrichen `/` schreiben, nicht mit `\` und immer als vollständigen Pfad.
- Beim Speichern mit dem Windows-Editor darauf achten, dass nicht `prep.json.txt` entsteht (Dateityp „Alle Dateien“ wählen). Alternativ empfiehlt sich die Verwendung von VS Code.

Ausführen in der OSGeo4W Shell:

```
cd /d <PROJEKT>
pdal pipeline prep.json
```

Das `/d` ist nötig, weil `cd` unter Windows sonst nicht das Laufwerk wechselt. Die Berechnung dauert 10 bis 30 Minuten. Währenddessen wird kein Fortschritt angezeigt. Den Fortgang erkennt man an der wachsenden Zieldatei im Explorer.

### Begründung der Vorgehensweise

**`spatialreference` und `in_srs` auf EPSG:4326 statt auf das Originalsystem:** Die Datei nennt ein zusammengesetztes System aus WGS 84 und dem Höhenbezug EGM96. Bei Übernahme dieses Systems würde PROJ versuchen, ein Geoidmodell herunterzuladen und die Höhen umzurechnen. Das ist nicht erforderlich, da später die Höhe *über dem Boden* berechnet wird und der absolute Höhenbezug dabei entfällt. So wird eine unnötige Fehlerquelle vermieden.

**`filters.decimation` statt `filters.sample`:** `filters.sample` würde gleichmäßiger ausdünnen, baut dafür aber einen Suchbaum über alle 256 Mio. Punkte auf und benötigt mehr Arbeitsspeicher, als auf einem typischen Desktop-Rechner verfügbar ist. `decimation` behält jeden 20. Punkt bei. Da die Punkte in Aufnahmereihenfolge gespeichert sind, verteilen sich die verbleibenden Punkte räumlich ausreichend gleichmäßig. Übrig bleiben rund 12,8 Mio. Punkte, etwa 60 pro Quadratmeter.

**COPC als Ausgabeformat:** komprimiert (aus 8,7 GB werden ca. 200 MB) und mit räumlichem Index, sodass QGIS die Wolke flüssig darstellen kann.

### Kontrolle

```
pdal info --summary <PROJEKT>\pointcloud\wald_utm33.copc.laz
```

Die Grenzen (`bounds`) müssen jetzt sechs- bzw. siebenstellige Meterwerte zeigen: Rechtswerte um 380.000, Hochwerte um 5.825.000. Stehen dort noch Werte wie 13,25, hat die Umprojektion nicht funktioniert.

---

## 6. Orthofoto umprojizieren

Damit Kronenumrisse und Foto später deckungsgleich übereinanderliegen, muss auch das Bild in dasselbe System. In der OSGeo4W Shell im Projektordner (als **eine** Zeile):

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

Zusätzlich empfiehlt es sich, in QGIS für das neue Bild Pyramiden anzulegen (Eigenschaften → Pyramiden). Dadurch bleibt das Zoomen flüssig.

---

## 7. Bodenklassifikation prüfen

Die von der DJI-Software automatisch erzeugte Bodenklassifikation muss auf ihre Verlässlichkeit geprüft werden.

1. `wald_utm33.copc.laz` in **CloudCompare** öffnen.
2. Als Einfärbung das Skalarfeld **Classification** wählen.
3. Mit dem **Cross Section**-Werkzeug einen etwa 5 m breiten Streifen quer durch den Wald ausschneiden.
4. In der Seitenansicht prüfen: Liegen die Bodenpunkte als dünne Schicht unten? Oder ziehen sie sich bis in die Kronen?

In den vorliegenden Daten liegen die Bodenpunkte wie erwartet in der unteren Schicht, der hohe Bodenanteil erklärt sich durch das Flugfeld. Die Klassifikation wird daher übernommen.

**Warum dieser Schritt wichtig ist:** Wenn fälschlich Bodenvegetation oder tiefe Kronenteile als Boden markiert sind, liegt das Geländemodell zu hoch. Dann werden *alle* Bäume systematisch zu niedrig berechnet, ohne dass dies am Ergebnis erkennbar ist. Bei schlechter Klassifikation müsste diese verworfen und der Boden neu berechnet werden (z. B. mit PDALs `filters.smrf` oder `filters.csf`).

---

## 8. Gelände- und Oberflächenmodell berechnen

Es werden zwei Raster mit 25 cm Auflösung erzeugt:

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

### Begründung der Vorgehensweise

**`output_type: idw` beim DTM:** Unter dichten Kronen gibt es nur wenige Bodenpunkte. Die inverse Distanzgewichtung mittelt die vorhandenen Punkte sinnvoll, statt einzelne Ausreißer zu übernehmen.

**`output_type: max` beim DSM:** Relevant ist die oberste Oberfläche, also die Baumkrone und nicht Äste darunter.

**`window_size`:** Füllt Pixel ohne Punkte durch Interpolation aus der Nachbarschaft. Beim DTM größer, weil unter Bäumen größere Lücken auftreten.

**Warum PDAL statt Python?** PDAL verarbeitet Punktwolken sehr effizient. Durch die Rasterung in PDAL ist in Python keine Punktwolkenbibliothek erforderlich, dort werden nur noch Bilder verarbeitet. Weil beide Pipelines dieselbe Punktwolke lesen, liegen DTM und DSM automatisch exakt auf demselben Raster und können direkt voneinander abgezogen werden.

---

## 9. Waldfläche abgrenzen

Da Rollfeld und Straße mit erfasst sind, wird der eigentliche Wald manuell abgegrenzt.

1. In QGIS: Layer → Layer erstellen → **Neuer GeoPackage-Layer**.
2. Im Feld **Datenbank (bzw. Dateiname)** über die drei Punkte rechts den Speicherort wählen: `<PROJEKT>\wald_polygon.gpkg`.
   Achtung: Das Feld „Tabellenname“ ist nur der Layername *innerhalb* der Datei. Wer nur das ausfüllt, speichert oft in einem unerwarteten Ordner.
3. Geometrietyp **Polygon**, KBS **EPSG:25833**.
4. Bearbeitungsmodus einschalten (Stiftsymbol), mit dem Orthofoto (`dom_utm33.tif`) im Hintergrund ein Polygon um den Wald zeichnen, mit Rechtsklick abschließen, Bearbeitung speichern.

**Warum großzügig zeichnen?** Das Polygon sollte ein paar Meter über den Waldrand hinausgehen. Sonst werden Randbäume angeschnitten oder fallen heraus.

**Warum überhaupt?** Einerseits für die Angabe „Bäume pro Hektar“, für die man die echte Waldfläche braucht. Andererseits, um Büsche und Einzelbäume am Rand des Flugfelds (Nachbargrundstück) auszuschließen.

---

## 10. Baumerkennung im Jupyter-Notebook

Die Notebook-Datei ist auf GitHub unter dem Namen `baum_erkennung+gesundheit.ipynb` zu finden. Die folgenden Beschreibungen ermöglichen auch die Erstellung eines eigenen Notebooks.

### Warum ein Notebook?

In dieser Phase werden Parameter variiert und die Ergebnisse geprüft. Im Notebook lädt man die Daten einmal und führt danach nur die Zelle mit der Baumerkennung erneut aus. Die Kontrollbilder erscheinen direkt darunter. Wenn die Parameter feststehen, könnte man den Ablauf in ein `.py`-Skript überführen.

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
- **Medianfilter:** Eine Baumkrone ist im Höhenmodell nicht glatt, sondern hat viele kleine Spitzen durch einzelne Äste. Ohne Glättung würde jede davon als eigener Baum erkannt werden.

### Zelle 3: Baumspitzen und Kronen (diese Zelle wiederholt man beim Einstellen)

```python
win = 7   # Fenstergröße in Pixeln, 7 × 25 cm ≈ 1,75 m

mx = ndimage.maximum_filter(chm, size=win)
tops = (chm == mx) & (chm > 5)
labels, n = ndimage.label(tops)
print(f"{n} Bäume gefunden")

crowns = watershed(-chm, markers=labels, mask=chm > 2)
```

Funktionsweise:
- **Lokale Maxima:** Ein Pixel gilt als Baumspitze, wenn es in seinem Fenster der höchste Punkt ist und über 5 m liegt (damit Büsche nicht mitgezählt werden).
- **Watershed (Wasserscheide):** Man stellt sich das umgedrehte Höhenmodell als Landschaft vor, die von den Baumspitzen aus „geflutet“ wird. Wo sich das Wasser zweier Spitzen trifft, verläuft die Kronengrenze.

**Der Parameter `win` ist die wichtigste Stellgröße.** Er legt fest, wie weit zwei Spitzen mindestens auseinanderliegen müssen, um als zwei Bäume zu gelten.

- Zu klein: Eine große Krone zerfällt in mehrere „Bäume“.
- Zu groß: Nachbarbäume verschmelzen zu einem.

Für den vorliegenden Bestand hat **`win = 7`** das beste Ergebnis geliefert. Bei anderen Beständen (z. B. schmale Kiefern vs. breite Buchen) kann ein anderer Wert besser passen.

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

Die Ausschnittskoordinaten so anpassen, dass der gewählte Bereich innerhalb des Waldes liegt. **Ist jeder rote Punkt genau einer Krone zugeordnet, ist der gewählte Wert für `win` geeignet.** Zur Kontrolle mehrere Ausschnitte aus verschiedenen Bereichen des Bestands prüfen.

---

## 11. Kronen als Polygone exportieren

Bisher liegen die Kronen nur als Bild mit Nummern vor. Für die weitere Auswertung und für QGIS werden sie in Polygone mit Attributen umgewandelt.

```python
from rasterio.features import shapes
from shapely.geometry import shape

geoms, ids = [], []
for g, v in shapes(crowns.astype("int32"), mask=crowns > 0, transform=prof["transform"]):
    geoms.append(shape(g)); ids.append(int(v))

gdf = gpd.GeoDataFrame({"id": ids}, geometry=geoms, crs="EPSG:25833")
gdf = gdf.dissolve(by="id").reset_index()   # ein Polygon pro Baum

# Hoehe = hoechster CHM-Wert in der Krone
gdf["hoehe_m"] = ndimage.maximum(chm, labels=crowns, index=gdf["id"].values)
gdf["flaeche_m2"] = gdf.area
gdf["durchm_m"] = 2 * np.sqrt(gdf["flaeche_m2"] / np.pi)

gdf.head()
```

Warum:
- **`dissolve`:** Hängt eine Krone nur über ein einzelnes Pixel zusammen, erzeugt die Vektorisierung zwei Teilflächen. `dissolve` fasst alles mit derselben Nummer wieder zu einem Baum zusammen.
- **Höhe** = höchster Wert im Kronenhöhenmodell innerhalb der Krone.
- **Durchmesser** = Durchmesser eines Kreises mit gleicher Fläche. Dieser Näherungswert eignet sich für Vergleiche.

### Auf den Wald zuschneiden

```python
wald = gpd.read_file(base + "wald_polygon.gpkg").to_crs(25833)
gdf = gdf[gdf.centroid.within(wald.union_all())].copy()
print(f"{len(gdf)} Bäume im Wald, {len(gdf) / (wald.area.sum() / 10000):.0f} pro ha")
```

**Warum über den Mittelpunkt?** Würde man die Polygone am Waldrand abschneiden, entstünden halbe Kronen mit falscher Fläche. Bei der Zuordnung über den Mittelpunkt wird jeder Baum vollständig in die Auswertung einbezogen oder ausgeschlossen.

---

## 12. Farbwerte pro Krone und auffällige Bäume

Für die Farbauswertung werden die Kronen über das Orthofoto gelegt und die Farbwerte pro Baum gemessen.

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
- **Kronenweise lesen:** Das Orthofoto ist mehrere GB groß. Es wird jeweils nur der kleine Ausschnitt einer Krone gelesen, so bleibt der Speicherbedarf gering.
- **Negativer Puffer von 30 cm:** Am Rand einer Krone mischen sich Nachbarkrone und Waldboden ins Bild. Die Messung erfolgt deshalb nur im Inneren.
- **Transparenz und Schatten ausschließen:** Pixel mit Alpha 0 liegen außerhalb des Bildes. Sehr dunkle Pixel (Helligkeitssumme unter 90) sind Schatten und würden gesunde Bäume dunkel und damit „krank“ erscheinen lassen.
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

**Warum relativ statt mit festem Grenzwert?** Verschiedene Baumarten haben von Natur aus unterschiedliche Farben, die Arten wurden hier nicht bestimmt. Deshalb erfolgt der Vergleich mit dem Bestand: Als auffällig gilt ein Baum, dessen Grünanteil mehr als zwei Standardabweichungen unter dem typischen Wert der Fläche liegt.

### Ergebnis prüfen

`baeume.gpkg` in QGIS über `dom_utm33.tif` laden, Symbolisierung auf **Abgestuft** nach `gcc`. Die markierten Bäume im Orthofoto einzeln prüfen.

Ein Teil der markierten Bäume kann tatsächlich geschädigt sein (Totholz, verbräunte Kronen), bei anderen kann es sich um Fehlalarme handeln, z. B. um generell dunklere Nadelbäume oder stark verschattete Kronen. Die Auswertung dient der Vorauswahl von Bäumen für eine genauere Begutachtung, sie stellt keine Diagnose dar.

Bei gemischten Beständen kann es sinnvoll sein, die Z-Werte getrennt für Nadel- und Laubbäume zu berechnen, damit nicht überproportional viele Nadelbäume als auffällig gelten.

---

## 13. Ergebnis validieren

Dass `win = 7` „am besten aussieht“, ist ein erster Hinweis, aber noch keine belastbare Aussage. Dafür ist eine manuelle Zählung in einer Stichprobe erforderlich.

1. Zwei bis drei Ausschnitte von je etwa einem halben Hektar wählen, möglichst in unterschiedlichen Bestandsteilen (dicht, locker, Waldrand).
2. Im Orthofoto (evtl. mit dem CHM als Hilfe) jeden Baum manuell als Punkt markieren.
3. Mit den automatisch erkannten Baumspitzen vergleichen und zählen:
   - **TP** (richtig erkannt): Baum vorhanden und gefunden
   - **FN** (übersehen): Baum vorhanden, aber nicht gefunden
   - **FP** (Fehldetektion): gefunden, aber kein eigener Baum

Daraus:

- **Precision** = TP / (TP + FP): Wie viele der gefundenen Bäume sind echt?
- **Recall** = TP / (TP + FN): Wie viele der echten Bäume wurden gefunden?
- **F1** = 2 · Precision · Recall / (Precision + Recall): Gesamtmaß

Erst damit wird aus „der Algorithmus hat X Bäume gezählt“ eine Aussage mit bekannter Fehlerquote.

---

## 14. Grenzen der Methode

- **Unterstand ist unsichtbar:** Kleinere Bäume unter dem Kronendach erfasst weder das Foto noch (zuverlässig) der Laser. Die Zählung bezieht sich auf die Bäume der oberen Kronenschicht.
- **Dichte Laubbestände** mit ineinander verwachsenen Kronen werden schlechter getrennt als lockere Bestände oder Nadelwald.
- **Kein Nahinfrarot:** Mit reinen RGB-Daten erkennt man vor allem sichtbare, also eher fortgeschrittene Schäden. Beginnender Trockenstress ist so kaum zu erkennen. Dafür bräuchte man Multispektral- oder Thermalaufnahmen.
- **Nur ein Aufnahmezeitpunkt** (Juli 2026): Die Bäume lassen sich nur untereinander vergleichen, nicht mit ihrem eigenen früheren Zustand. Eine Wiederholungsbefliegung würde die Aussagekraft deutlich erhöhen.
- **Farbe ist unspezifisch:** Trockenheit, Schädlinge, Pilze oder Wurzelschäden sehen aus der Luft ähnlich aus. Die Ursache muss vor Ort identifiziert werden.
- **Keine Artbestimmung:** Dafür bräuchte es zusätzliche Spektralinformation und im Gelände bestimmte Referenzbäume als Trainingsdaten.

---

## 15. Häufige Fehler und Lösungen

| Problem | Ursache | Lösung |
|---|---|---|
| `Failed building wheel for gdal` | `pip install gdal` versucht, C++-Code zu kompilieren | nicht nötig: `rasterio` verwenden, GDAL-Befehle in der OSGeo4W Shell |
| `pdal` oder `gdalwarp` nicht gefunden | normale Eingabeaufforderung statt OSGeo4W Shell | OSGeo4W Shell aus dem Startmenü öffnen |
| „Das System kann den angegebenen Pfad nicht finden“ bei `cd` | Laufwerkswechsel ohne `/d`, oder zwei Befehle beim Kopieren zu einer Zeile verschmolzen | `cd /d ...` verwenden, Befehle einzeln eingeben |
| PDAL zeigt keinen sichtbaren Fortschritt | PDAL zeigt keinen Fortschritt an | Zieldatei im Explorer beobachten, sie wächst |
| Pipeline findet `prep.json` nicht | Datei wurde als `prep.json.txt` gespeichert | im Explorer Dateiendungen einblenden, umbenennen |
| QGIS zeigt bei Punktwolkenstatistik überall `nan` | QGIS berechnet die Statistik für große LAS-Dateien nicht | stattdessen `pdal info --stats` verwenden |
| Nach der Umprojektion noch Werte wie 13,25 in den Bounds | Umprojektion hat nicht gegriffen | `in_srs`/`out_srs` in der Pipeline prüfen |
| `ModuleNotFoundError: rasterio` im Notebook | falscher Python-Kernel ausgewählt | in VS Code oben rechts die `venv` als Kernel wählen |
| `DataSourceError: ... wald_polygon.gpkg: No such file or directory` | GeoPackage wurde an einem anderen Speicherort oder unter anderem Namen gespeichert | in QGIS Rechtsklick auf Layer → Eigenschaften → Information → Pfad nachsehen oder `glob.glob(base + "**/*.gpkg", recursive=True)` |
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
| `baeume.gpkg` | ein Polygon pro Baum mit Höhe, Fläche, Durchmesser, Farbwerten, GCC und Auffälligkeitsmarkierung |
