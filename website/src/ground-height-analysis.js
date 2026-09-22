function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function parseGroundHeightCsv(csv, createTranslatedError) {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw createTranslatedError('heightCsvEmpty');

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map((header) => header.trim().toLowerCase());
  const longitudeIndex = headers.indexOf('longitude');
  const latitudeIndex = headers.indexOf('latitude');
  const heightIndex = headers.indexOf('ground_height_m');
  if ([longitudeIndex, latitudeIndex, heightIndex].includes(-1)) {
    throw createTranslatedError('heightCsvColumns');
  }

  const parseNumber = (value) => Number(value.trim().replace(',', '.'));
  const samples = lines.slice(1).map((line, index) => {
    const columns = line.split(delimiter);
    const sample = {
      longitude: parseNumber(columns[longitudeIndex] ?? ''),
      latitude: parseNumber(columns[latitudeIndex] ?? ''),
      groundHeight: parseNumber(columns[heightIndex] ?? '')
    };
    if (!Object.values(sample).every(Number.isFinite)) {
      throw createTranslatedError('heightCsvInvalid', { row: index + 2 });
    }
    return sample;
  });

  if (samples.length < 2) throw createTranslatedError('heightCsvMinimum');
  return samples;
}

function distanceInMeters(a, b) {
  const averageLatitude = (a.latitude + b.latitude) / 2 * Math.PI / 180;
  const x = (a.longitude - b.longitude) * 111320 * Math.cos(averageLatitude);
  const y = (a.latitude - b.latitude) * 111320;
  return Math.hypot(x, y);
}

function pointOnSegment([longitude, latitude], start, end) {
  const crossProduct =
    (latitude - start[1]) * (end[0] - start[0]) -
    (longitude - start[0]) * (end[1] - start[1]);
  if (Math.abs(crossProduct) > 1e-10) return false;

  return (
    longitude >= Math.min(start[0], end[0]) &&
    longitude <= Math.max(start[0], end[0]) &&
    latitude >= Math.min(start[1], end[1]) &&
    latitude <= Math.max(start[1], end[1])
  );
}

function ringContainsPoint(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const start = ring[previous];
    const end = ring[index];
    if (pointOnSegment(point, start, end)) return true;

    const crossesLatitude = start[1] > point[1] !== end[1] > point[1];
    if (
      crossesLatitude &&
      point[0] <
        ((end[0] - start[0]) * (point[1] - start[1])) /
          (end[1] - start[1]) +
          start[0]
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonContainsPoint(point, rings) {
  return (
    Boolean(rings[0]) &&
    ringContainsPoint(point, rings[0]) &&
    !rings.slice(1).some((hole) => ringContainsPoint(point, hole))
  );
}

export function geometryContainsPoint(geometry, point) {
  if (geometry?.type === 'Polygon') {
    return polygonContainsPoint(point, geometry.coordinates);
  }
  if (geometry?.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => polygonContainsPoint(point, polygon));
  }
  return false;
}

function analyseSamples(samples) {
  return samples.map((sample, index) => {
    const nearest = samples
      .filter((_, candidateIndex) => candidateIndex !== index)
      .map((candidate) => ({ candidate, distance: distanceInMeters(sample, candidate) }))
      .sort((a, b) => a.distance - b.distance);
    const neighbours = nearest.slice(0, Math.min(6, nearest.length));
    const localReference = median(neighbours.map(({ candidate }) => candidate.groundHeight));
    return { ...sample, localReference };
  });
}

function interpolateAt(point, samples) {
  const nearest = samples
    .map((sample) => ({ sample, distance: distanceInMeters(point, sample) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(8, samples.length));
  const exact = nearest.find(({ distance }) => distance < 0.5);
  if (exact) {
    return { groundHeight: exact.sample.groundHeight, referenceHeight: exact.sample.localReference };
  }

  let totalWeight = 0;
  let groundHeight = 0;
  let referenceHeight = 0;
  nearest.forEach(({ sample, distance }) => {
    const weight = 1 / Math.pow(Math.max(distance, 1), 2);
    totalWeight += weight;
    groundHeight += sample.groundHeight * weight;
    referenceHeight += sample.localReference * weight;
  });
  return {
    groundHeight: groundHeight / totalWeight,
    referenceHeight: referenceHeight / totalWeight
  };
}

function intersectVertical(start, end, longitude) {
  const distance = end[0] - start[0];
  const ratio = distance === 0 ? 0 : (longitude - start[0]) / distance;
  return [longitude, start[1] + (end[1] - start[1]) * ratio];
}

function intersectHorizontal(start, end, latitude) {
  const distance = end[1] - start[1];
  const ratio = distance === 0 ? 0 : (latitude - start[1]) / distance;
  return [start[0] + (end[0] - start[0]) * ratio, latitude];
}

function clipPolygonToCell(ring, west, south, east, north) {
  let polygon = ring.slice(0, -1);
  const edges = [
    { inside: (point) => point[0] >= west, intersect: (start, end) => intersectVertical(start, end, west) },
    { inside: (point) => point[0] <= east, intersect: (start, end) => intersectVertical(start, end, east) },
    { inside: (point) => point[1] >= south, intersect: (start, end) => intersectHorizontal(start, end, south) },
    { inside: (point) => point[1] <= north, intersect: (start, end) => intersectHorizontal(start, end, north) }
  ];

  edges.forEach(({ inside, intersect }) => {
    if (!polygon.length) return;
    const clipped = [];
    let previous = polygon[polygon.length - 1];
    polygon.forEach((current) => {
      const currentInside = inside(current);
      const previousInside = inside(previous);
      if (currentInside) {
        if (!previousInside) clipped.push(intersect(previous, current));
        clipped.push(current);
      } else if (previousInside) {
        clipped.push(intersect(previous, current));
      }
      previous = current;
    });
    polygon = clipped;
  });

  if (polygon.length < 3) return null;
  return [...polygon, polygon[0]];
}

export function createGroundHeightFeatures(
  samples,
  boundaryRing,
  analysisGeometry,
  cellSizeMeters,
) {
  const analysisSamples = samples.filter((sample) =>
    geometryContainsPoint(analysisGeometry, [sample.longitude, sample.latitude]),
  );
  const analysedSamples =
    analysisSamples.length >= 2 ? analyseSamples(analysisSamples) : [];
  const longitudes = boundaryRing.map(([longitude]) => longitude);
  const latitudes = boundaryRing.map(([, latitude]) => latitude);
  const west = Math.min(...longitudes);
  const east = Math.max(...longitudes);
  const south = Math.min(...latitudes);
  const north = Math.max(...latitudes);
  const averageLatitude = (south + north) / 2;
  const longitudeStep = cellSizeMeters / (111320 * Math.cos(averageLatitude * Math.PI / 180));
  const latitudeStep = cellSizeMeters / 111320;
  const features = [];

  for (let cellSouth = south; cellSouth < north; cellSouth += latitudeStep) {
    for (let cellWest = west; cellWest < east; cellWest += longitudeStep) {
      const cellEast = Math.min(cellWest + longitudeStep, east);
      const cellNorth = Math.min(cellSouth + latitudeStep, north);
      const clippedRing = clipPolygonToCell(boundaryRing, cellWest, cellSouth, cellEast, cellNorth);
      if (!clippedRing) continue;

      const point = {
        longitude: (cellWest + cellEast) / 2,
        latitude: (cellSouth + cellNorth) / 2
      };
      const calculated = geometryContainsPoint(analysisGeometry, [
        point.longitude,
        point.latitude,
      ]);
      const properties = { calculated };
      if (calculated && analysedSamples.length >= 2) {
        const { groundHeight, referenceHeight } = interpolateAt(point, analysedSamples);
        const heightDifference = Math.abs(groundHeight - referenceHeight);
        Object.assign(properties, {
          groundHeight: Number(groundHeight.toFixed(3)),
          referenceHeight: Number(referenceHeight.toFixed(3)),
          heightDifference: Number(heightDifference.toFixed(3)),
        });
      }
      features.push({
        type: 'Feature',
        properties,
        geometry: { type: 'Polygon', coordinates: [clippedRing] }
      });
    }
  }

  return { features, analysisSampleCount: analysisSamples.length };
}
