export const eventsCalendarUrl =
  'https://www.campus-stadt-natur.de/angebote-aktionen/kalender/?id=524&no_cache=1&tx_events2_events%5Baction%5D=list&tx_events2_events%5Bcontroller%5D=JavaScriptSearch&tx_events2_events%5Bcategories%5D%5B%5D=&tx_events2_events%5Bgroups%5D%5B%5D=&tx_events2_events%5Blocations%5D%5B%5D=50&tx_events2_events%5Bstart%5D=&tx_events2_events%5Bend%5D=&tx_events2_events%5Bsearch%5D=';

function escapeCalendarText(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function formatCalendarDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function calendarFilename(title) {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de-DE')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
  return `${slug || 'event'}.ics`;
}

function foldCalendarLine(line) {
  const encoder = new TextEncoder();
  const folded = [];
  let part = '';
  let limit = 75;
  for (const character of line) {
    if (encoder.encode(part + character).length > limit) {
      folded.push(part);
      part = ` ${character}`;
      limit = 75;
    } else {
      part += character;
    }
  }
  folded.push(part);
  return folded.join('\r\n');
}

function createCalendarFile(event) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  const location = [event.location, event.meeting_point]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(' – ');
  const description = [event.format, event.provider, event.price]
    .filter(Boolean)
    .join('\n');
  const uidSource = `${event.source_url || event.title}-${event.start}`;
  const uid = `${encodeURIComponent(uidSource).replace(/%/g, '')}@berlin-txl`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Berlin TXL//Eventkalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${formatCalendarDate(start)}`,
    `DTEND:${formatCalendarDate(end)}`,
    `SUMMARY:${escapeCalendarText(event.title)}`,
  ];
  if (location) lines.push(`LOCATION:${escapeCalendarText(location)}`);
  if (description) lines.push(`DESCRIPTION:${escapeCalendarText(description)}`);
  if (event.source_url) lines.push(`URL:${event.source_url}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return `${lines.map(foldCalendarLine).join('\r\n')}\r\n`;
}

export function downloadCalendarFile(event) {
  const blob = new Blob([createCalendarFile(event)], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const download = document.createElement('a');
  download.href = url;
  download.download = calendarFilename(event.title);
  document.body.append(download);
  download.click();
  download.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function eventStatusKey(status = '') {
  return status.toLocaleLowerCase('de-DE') === 'verfügbar'
    ? 'eventAvailable'
    : status.toLocaleLowerCase('de-DE') === 'ausgebucht'
      ? 'eventSoldOut'
      : null;
}

export function uniqueEventValues(events, getValues) {
  return [...new Set(events.flatMap(getValues).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'de'));
}

export function eventFilterOptions(events) {
  return {
    status: uniqueEventValues(events, (event) => [event.status]),
    format: uniqueEventValues(events, (event) => [event.format]),
    targetGroup: uniqueEventValues(events, (event) => event.target_groups ?? []),
  };
}

export function hasActiveEventFilters(filters) {
  return Object.values(filters).some((value) => value !== 'all');
}

export function eventCountText(t, visibleCount, totalCount) {
  return visibleCount === totalCount
    ? t('eventCount', { count: visibleCount })
    : t('eventFilteredCount', { count: visibleCount, total: totalCount });
}

export function eventLocale(language) {
  return { de: 'de-DE', en: 'en-GB', fr: 'fr-FR' }[language] ?? language;
}

export function filterEvents(events, { status, format, targetGroup }) {
  return events.filter((event) =>
    (status === 'all' || event.status === status) &&
    (format === 'all' || event.format === format) &&
    (targetGroup === 'all' || event.target_groups?.includes(targetGroup)));
}
