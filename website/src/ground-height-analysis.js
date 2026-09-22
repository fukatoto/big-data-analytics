export function parseGroundHeightCsv(csv, createTranslatedError) {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw createTranslatedError('heightCsvEmpty');

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map((header) => header.trim().toLowerCase());
  const longitudeIndex = headers.indexOf('longitude');
  const latitudeIndex = headers.indexOf('latitude');
  const heightIndex = headers.indexOf('ground_height_m');
  const labelIndex = headers.indexOf('label');
  if ([longitudeIndex, latitudeIndex, heightIndex, labelIndex].includes(-1)) {
    throw createTranslatedError('heightCsvColumns');
  }

  const parseNumber = (value) => Number(value.trim().replace(',', '.'));
  const samples = lines.slice(1).map((line, index) => {
    const columns = line.split(delimiter);
    const sample = {
      longitude: parseNumber(columns[longitudeIndex] ?? ''),
      latitude: parseNumber(columns[latitudeIndex] ?? ''),
      groundHeight: parseNumber(columns[heightIndex] ?? ''),
      label: (columns[labelIndex] ?? '').trim(),
    };
    if (![sample.longitude, sample.latitude, sample.groundHeight].every(Number.isFinite)) {
      throw createTranslatedError('heightCsvInvalid', { row: index + 2 });
    }
    return sample;
  });

  const references = samples.filter((sample) => sample.label.toLowerCase() === 'referenz');
  if (references.length !== 1) throw createTranslatedError('heightCsvReference');

  const measurements = samples.filter((sample) => sample !== references[0]);
  if (!measurements.length) throw createTranslatedError('heightCsvMinimum');
  return {
    measurements,
    reference: references[0],
    referenceHeight: references[0].groundHeight,
  };
}
