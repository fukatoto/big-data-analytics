import * as maplibregl from 'maplibre-gl';
import { airportBounds, airportViewPadding, places } from './config.js';

const eventsCalendarUrl =
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

function downloadCalendarFile(event) {
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

export function createMapController({ map, t, onSelectProjectArea }) {
  const state = {
    dimension: '3d',
    view: 'campus',
    caption: 'campus',
    selected: 'tegeler-stadtheide',
    PlacesVisible: false,
    events: [],
    eventsStatus: 'loading',
    selectedEventUrl: null,
    eventFilters: {
      status: 'all',
      format: 'all',
      targetGroup: 'all',
    },
  };
  const markerElements = new Map();
  let placePopup = null;

  function placeName(place) {
    return place.nameKey ? t(place.nameKey) : place.name;
  }

  function eventStatusKey(status = '') {
    return status.toLocaleLowerCase('de-DE') === 'verfügbar'
      ? 'eventAvailable'
      : status.toLocaleLowerCase('de-DE') === 'ausgebucht'
        ? 'eventSoldOut'
        : null;
  }

  function uniqueEventValues(getValues) {
    return [...new Set(state.events.flatMap(getValues).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, 'de'),
    );
  }

  function filteredEvents() {
    const { status, format, targetGroup } = state.eventFilters;
    return state.events.filter(
      (event) =>
        (status === 'all' || event.status === status) &&
        (format === 'all' || event.format === format) &&
        (targetGroup === 'all' || event.target_groups?.includes(targetGroup)),
    );
  }

  function eventCountText() {
    const visibleCount = filteredEvents().length;
    return visibleCount === state.events.length
      ? t('eventCount', { count: visibleCount })
      : t('eventFilteredCount', {
          count: visibleCount,
          total: state.events.length,
        });
  }

  function createFilterSelect({
    key,
    labelKey,
    allKey,
    values,
    formatValue = (value) => value,
  }) {
    const select = document.createElement('select');
    select.className = 'event-filter-select';
    select.setAttribute('aria-label', t(labelKey));
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = t(allKey);
    select.append(allOption);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = formatValue(value);
      select.append(option);
    });
    select.value = state.eventFilters[key];
    select.addEventListener('change', () => {
      state.eventFilters[key] = select.value;
      refreshEventViews();
    });
    return select;
  }

  function createEventFilters() {
    const controls = document.createElement('div');
    controls.className = 'event-filter-controls';
    controls.append(
      createFilterSelect({
        key: 'status',
        labelKey: 'filterByStatus',
        allKey: 'allStatuses',
        values: uniqueEventValues((event) => event.status),
        formatValue: (value) => {
          const statusKey = eventStatusKey(value);
          return statusKey ? t(statusKey) : value;
        },
      }),
      createFilterSelect({
        key: 'format',
        labelKey: 'filterByFormat',
        allKey: 'allFormats',
        values: uniqueEventValues((event) => event.format),
      }),
      createFilterSelect({
        key: 'targetGroup',
        labelKey: 'filterByTargetGroup',
        allKey: 'allTargetGroups',
        values: uniqueEventValues((event) => event.target_groups ?? []),
      }),
    );
    const filtersActive = Object.values(state.eventFilters).some(
      (value) => value !== 'all',
    );
    controls.classList.toggle('has-active-filters', filtersActive);
    if (filtersActive) {
      const reset = document.createElement('button');
      reset.className = 'event-filter-reset';
      reset.type = 'button';
      reset.textContent = t('resetFilters');
      reset.addEventListener('click', () => {
        state.eventFilters = {
          status: 'all',
          format: 'all',
          targetGroup: 'all',
        };
        refreshEventViews();
      });
      controls.append(reset);
    }
    return controls;
  }

  function createEventCard(event) {
    const language = document.documentElement.lang || 'de';
    const locale =
      { de: 'de-DE', en: 'en-GB', fr: 'fr-FR' }[language] ?? language;
    const start = new Date(event.start);
    const end = new Date(event.end);
    const dateParts = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
    }).formatToParts(start);
    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const statusKey = eventStatusKey(event.status);
    const card = document.createElement('button');
    card.className = 'event-card';
    card.type = 'button';
    card.setAttribute('aria-label', t('eventOpen', { event: event.title }));
    card.addEventListener('click', () => showEventDetail(event));

    const visual = document.createElement('span');
    visual.className = 'event-card-visual';
    const image = document.createElement('img');
    image.src = event.cover_image_url;
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () =>
      visual.classList.add('has-image-error'),
    );
    const date = document.createElement('span');
    date.className = 'event-date';
    const day = document.createElement('strong');
    day.textContent =
      dateParts.find((part) => part.type === 'day')?.value ?? '';
    const month = document.createElement('span');
    month.textContent = (
      dateParts.find((part) => part.type === 'month')?.value ?? ''
    ).replace('.', '');
    date.append(day, month);
    visual.append(image, date);

    const content = document.createElement('span');
    content.className = 'event-card-content';
    const topLine = document.createElement('span');
    topLine.className = 'event-card-topline';
    const format = document.createElement('span');
    format.className = 'event-format';
    format.textContent = event.format;
    const status = document.createElement('span');
    status.className = `event-status ${statusKey === 'eventAvailable' ? 'is-available' : 'is-sold-out'}`;
    status.textContent = statusKey ? t(statusKey) : event.status;
    topLine.append(format, status);
    const title = document.createElement('strong');
    title.className = 'event-title';
    title.textContent = event.title;
    const meta = document.createElement('span');
    meta.className = 'event-meta';
    meta.textContent = `${timeFormatter.format(start)}–${timeFormatter.format(end)} · ${event.price}`;
    content.append(topLine, title, meta);
    card.append(visual, content);
    return card;
  }

  function renderEvents() {
    const title = document.getElementById('event-overview-link-label');
    const count = document.getElementById('event-count');
    const filters = document.getElementById('event-filters');
    const list = document.getElementById('event-list');
    title.textContent = t('eventsAtTent');
    count.textContent =
      state.eventsStatus === 'ready'
        ? eventCountText()
        : '';
    filters.replaceChildren();
    list.replaceChildren();

    if (state.eventsStatus !== 'ready') {
      const message = document.createElement('p');
      message.className = `event-message ${state.eventsStatus === 'error' ? 'is-error' : ''}`;
      message.textContent = t(
        state.eventsStatus === 'error' ? 'eventsLoadError' : 'eventsLoading',
      );
      list.append(message);
      return;
    }
    filters.append(createEventFilters());
    const events = filteredEvents();
    if (!events.length) {
      const message = document.createElement('p');
      message.className = 'event-message';
      message.textContent = t('eventsNoResults');
      list.append(message);
      return;
    }
    events.forEach((event) => list.append(createEventCard(event)));
  }

  function renderEventDetail() {
    const container = document.getElementById('event-detail');
    const event = state.events.find(
      ({ source_url: sourceUrl }) => sourceUrl === state.selectedEventUrl,
    );
    const showsEventDetail = Boolean(event);
    container.replaceChildren();
    container.hidden = !showsEventDetail;
    document
      .getElementById('place-detail')
      .classList.toggle('is-showing-event', showsEventDetail);
    document
      .querySelector('.sidebar')
      .classList.toggle('is-showing-event', showsEventDetail);
    if (!event) return;

    const language = document.documentElement.lang || 'de';
    const locale =
      { de: 'de-DE', en: 'en-GB', fr: 'fr-FR' }[language] ?? language;
    const start = new Date(event.start);
    const end = new Date(event.end);
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const statusKey = eventStatusKey(event.status);

    const back = document.createElement('button');
    back.className = 'event-detail-back';
    back.type = 'button';
    back.setAttribute('aria-label', t('eventBackToOverview'));
    back.innerHTML = '<span aria-hidden="true">←</span>';
    const backLabel = document.createElement('span');
    backLabel.textContent = t('eventBackToOverview');
    back.append(backLabel);
    back.addEventListener('click', closeEventDetail);

    const cover = document.createElement('figure');
    cover.className = 'event-detail-cover';
    const coverImage = document.createElement('img');
    coverImage.src = event.cover_image_url;
    coverImage.alt = event.cover_image_alt ?? '';
    coverImage.decoding = 'async';
    coverImage.addEventListener('error', () => cover.remove());
    cover.append(coverImage);
    if (event.cover_image_credit) {
      const credit = document.createElement('figcaption');
      credit.textContent = `© ${event.cover_image_credit}`;
      cover.append(credit);
    }

    const eyebrow = document.createElement('div');
    eyebrow.className = 'event-detail-eyebrow';
    const format = document.createElement('span');
    format.textContent = event.format;
    const status = document.createElement('span');
    status.className = `event-status ${statusKey === 'eventAvailable' ? 'is-available' : 'is-sold-out'}`;
    status.textContent = statusKey ? t(statusKey) : event.status;
    eyebrow.append(format, status);

    const title = document.createElement('h2');
    title.id = 'event-detail-title';
    title.tabIndex = -1;
    title.textContent = event.title;

    const schedule = document.createElement('p');
    schedule.className = 'event-detail-schedule';
    schedule.textContent = `${dateFormatter.format(start)} · ${timeFormatter.format(start)}–${timeFormatter.format(end)}`;

    const facts = document.createElement('dl');
    facts.className = 'event-detail-facts';
    const addFact = (labelKey, value) => {
      if (!value) return;
      const item = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = t(labelKey);
      description.textContent = value;
      item.append(term, description);
      facts.append(item);
    };
    addFact('eventLocation', event.location);
    addFact('eventMeetingPoint', event.meeting_point);
    addFact('eventTargetGroups', event.target_groups?.join(' · '));
    addFact('eventPrice', event.price);
    addFact('eventProvider', event.provider);

    const actions = document.createElement('div');
    actions.className = 'event-detail-actions';

    const calendarExport = document.createElement('button');
    calendarExport.className = 'event-detail-calendar';
    calendarExport.type = 'button';
    calendarExport.innerHTML = `<span aria-hidden="true">↓</span><span>${t('eventAddToCalendar')}</span>`;
    calendarExport.addEventListener('click', () => downloadCalendarFile(event));

    const source = document.createElement('a');
    source.className = 'event-detail-link';
    source.href = event.source_url;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.innerHTML = `<span>${t('eventMoreInformation')}</span><span aria-hidden="true">↗</span>`;
    actions.append(calendarExport, source);

    container.append(back, cover, eyebrow, title, schedule, facts, actions);
  }

  function showEventDetail(event) {
    state.selectedEventUrl = event.source_url;
    document.getElementById('event-overview').hidden = true;
    renderEventDetail();
    closePlacePopup();
    requestAnimationFrame(() => {
      document.querySelector('.sidebar').scrollTo({ top: 0, behavior: 'smooth' });
      document.getElementById('event-detail-title')?.focus({ preventScroll: true });
    });
  }

  function closeEventDetail() {
    state.selectedEventUrl = null;
    renderEventDetail();
    if (state.selected === 'zelt') {
      document.getElementById('event-overview').hidden = false;
      requestAnimationFrame(() => {
        document
          .getElementById('event-overview-title')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function refreshEventViews() {
    renderEvents();
    if (placePopup && state.selected === 'zelt') {
      placePopup.setDOMContent(createTentPopupContent());
    }
  }

  function placeDescription(place) {
    return place.descriptionKey
      ? t(place.descriptionKey)
      : (place.description ?? '');
  }

  function createPlacePopupContent(place) {
    const content = document.createElement('article');
    content.className = 'place-popup';

    const popupImages = place.images ??
      (place.image
        ? [
            {
              src: place.image,
              alt: place.imageAlt ?? '',
              credit: place.coverImageCredit ?? '',
            },
          ]
        : []);

    if (popupImages.length) {
      const visual = document.createElement('figure');
      visual.className = 'place-popup-visual';
      const image = document.createElement('img');
      image.decoding = 'async';
      image.addEventListener('error', () => visual.remove());

      const caption = document.createElement('figcaption');
      caption.className = 'place-popup-caption';
      caption.setAttribute('aria-live', 'polite');
      const imageMeta = document.createElement('span');
      imageMeta.className = 'place-popup-image-meta';
      const imageLabel = document.createElement('span');
      imageLabel.className = 'place-popup-image-label';
      const imageCount = document.createElement('span');
      imageCount.className = 'place-popup-image-count';
      const imageCredit = document.createElement('span');
      imageCredit.className = 'place-popup-image-credit';
      imageMeta.append(imageLabel, imageCount);
      caption.append(imageMeta, imageCredit);

      let imageIndex = 0;
      let nextImageButton = null;

      function updatePopupImage() {
        const currentImage = popupImages[imageIndex];
        const viewLabel = currentImage.labelKey
          ? t(currentImage.labelKey)
          : '';
        image.src = currentImage.src;
        image.alt =
          currentImage.alt ??
          (viewLabel
            ? t('placeImageAlt', {
                place: placeName(place),
                view: viewLabel,
              })
            : '');
        imageLabel.textContent = viewLabel;
        imageCount.textContent =
          popupImages.length > 1
            ? `${imageIndex + 1}/${popupImages.length}`
            : '';
        imageCredit.textContent = currentImage.credit
          ? `© ${currentImage.credit}`
          : '';

        if (nextImageButton) {
          const nextImage = popupImages[(imageIndex + 1) % popupImages.length];
          const nextView = nextImage.labelKey ? t(nextImage.labelKey) : '';
          const buttonLabel = t('showNextPlaceImage', {
            place: placeName(place),
            view: nextView,
          });
          nextImageButton.setAttribute('aria-label', buttonLabel);
          nextImageButton.title = buttonLabel;
        }
      }

      visual.append(image, caption);
      if (popupImages.length > 1) {
        nextImageButton = document.createElement('button');
        nextImageButton.className = 'place-popup-image-next';
        nextImageButton.type = 'button';
        nextImageButton.innerHTML = '<span aria-hidden="true">⇄</span>';
        nextImageButton.addEventListener('click', () => {
          imageIndex = (imageIndex + 1) % popupImages.length;
          updatePopupImage();
        });
        visual.append(nextImageButton);
      }
      updatePopupImage();
      content.append(visual);
    }

    const body = document.createElement('div');
    body.className = 'place-popup-body';
    const title = document.createElement('h3');
    title.textContent = placeName(place);
    const description = document.createElement('p');
    description.textContent = placeDescription(place);
    body.append(title, description);
    content.append(body);
    return content;
  }

  function createTentPopupContent() {
    const language = document.documentElement.lang || 'de';
    const locale =
      { de: 'de-DE', en: 'en-GB', fr: 'fr-FR' }[language] ?? language;
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
    });
    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const content = document.createElement('section');
    content.className = 'tent-popup';
    const heading = document.createElement('div');
    heading.className = 'tent-popup-heading';
    const title = document.createElement('a');
    title.className = 'events-heading-link';
    title.href = eventsCalendarUrl;
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    title.setAttribute('aria-label', t('eventsCalendarOpen'));
    const titleLabel = document.createElement('span');
    titleLabel.textContent = t('eventsAtTent');
    const titleArrow = document.createElement('span');
    titleArrow.className = 'events-heading-arrow';
    titleArrow.setAttribute('aria-hidden', 'true');
    titleArrow.textContent = '↗';
    title.append(titleLabel, titleArrow);
    const count = document.createElement('span');
    count.textContent =
      state.eventsStatus === 'ready'
        ? eventCountText()
        : '';
    heading.append(title, count);
    content.append(heading);

    if (state.eventsStatus !== 'ready') {
      const message = document.createElement('p');
      message.className = 'tent-popup-message';
      message.textContent = t(
        state.eventsStatus === 'error' ? 'eventsLoadError' : 'eventsLoading',
      );
      content.append(message);
      return content;
    }

    content.append(createEventFilters());
    const list = document.createElement('div');
    list.className = 'tent-popup-list';
    const events = filteredEvents();
    if (!events.length) {
      const message = document.createElement('p');
      message.className = 'tent-popup-message';
      message.textContent = t('eventsNoResults');
      content.append(message);
      return content;
    }
    events.forEach((event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const statusKey = eventStatusKey(event.status);
      const link = document.createElement('button');
      link.className = 'tent-popup-event';
      link.type = 'button';
      link.setAttribute('aria-label', t('eventOpen', { event: event.title }));
      link.addEventListener('click', () => showEventDetail(event));
      const date = document.createElement('span');
      date.className = 'tent-popup-date';
      date.textContent = dateFormatter.format(start).replace('.', '');
      const details = document.createElement('span');
      details.className = 'tent-popup-event-details';
      const eventTitle = document.createElement('strong');
      eventTitle.textContent = event.title;
      const meta = document.createElement('span');
      meta.textContent = `${timeFormatter.format(start)}–${timeFormatter.format(end)} · ${event.format}`;
      details.append(eventTitle, meta);
      const status = document.createElement('span');
      status.className = `tent-popup-status ${statusKey === 'eventAvailable' ? 'is-available' : ''}`;
      status.textContent = statusKey ? t(statusKey) : event.status;
      link.append(date, details, status);
      list.append(link);
    });
    content.append(list);
    return content;
  }

  function showPlacePopup(id) {
    const place = places[id];
    if (!place?.coordinates) return;
    placePopup?.remove();
    const showsEvents = id === 'zelt';
    const showsGallery = Boolean(place.images?.length);
    placePopup = new maplibregl.Popup({
      anchor:
        window.innerWidth <= 700
          ? (showsEvents ? 'bottom' : 'top')
          : (showsGallery || showsEvents ? 'bottom' : 'bottom-left'),
      className: showsEvents ? 'tent-events-map-popup' : 'place-info-map-popup',
      closeButton: true,
      closeOnClick: false,
      closeOnMove: false,
      focusAfterOpen: false,
      maxWidth:
        window.innerWidth > 700
          ? 'min(480px, calc(100vw - 28px))'
          : 'min(340px, calc(100vw - 28px))',
      offset: window.innerWidth <= 700 ? 24 : 20,
    })
      .setLngLat(place.coordinates)
      .setDOMContent(
        showsEvents ? createTentPopupContent() : createPlacePopupContent(place),
      )
      .addTo(map);
    placePopup.on('close', () => {
      placePopup = null;
    });
  }

  function closePlacePopup() {
    placePopup?.remove();
    placePopup = null;
  }

  function setActiveButtons(selector, activeValue, attribute) {
    document.querySelectorAll(selector).forEach((button) => {
      const active = button.getAttribute(attribute) === activeValue;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function updateCaption() {
    let number = '01';
    let label = t('terminalCampus');
    if (state.caption === 'airport') {
      number = '02';
      label = t('formerAirportArea');
    } else if (state.caption === 'place') {
      const place = places[state.selected];
      number = place.number.slice(0, 2);
      label = placeName(place).toUpperCase();
    }
    document.getElementById('map-caption').innerHTML =
      `<span class="caption-line" aria-hidden="true"></span><span>${number} <span class="caption-slash">/</span> ${label}</span>`;
  }

  function updateSelectedPlace() {
    const place = places[state.selected];
    if (!place) return;
    const detail = document.getElementById('place-detail');
    const detailLink = document.getElementById('detail-link');
    const detailDescription = document.getElementById('detail-description');
    const eventOverview = document.getElementById('event-overview');
    const eventDetail = document.getElementById('event-detail');
    const showsEvents = state.selected === 'zelt';
    document
      .querySelector('.app-shell')
      .classList.toggle('is-tent-selected', showsEvents);
    map.resize();
    detail.classList.toggle('has-events', showsEvents);
    document
      .querySelector('.sidebar')
      .classList.toggle('has-event-detail', showsEvents);
    document.getElementById('detail-kicker-label').textContent = t(
      place.projectAreaId ? 'selectedProjectArea' : 'selectedPlace',
    );
    document.getElementById('detail-title').textContent = placeName(place);
    document.getElementById('detail-number').textContent = place.number;
    document.getElementById('edition-number').textContent = place.number;
    detailDescription.textContent = placeDescription(place);
    detailDescription.hidden = showsEvents;
    if (!showsEvents) state.selectedEventUrl = null;
    const showsEventDetail =
      showsEvents &&
      state.events.some(
        ({ source_url: sourceUrl }) => sourceUrl === state.selectedEventUrl,
      );
    eventOverview.hidden = !showsEvents || showsEventDetail;
    eventDetail.hidden = !showsEventDetail;
    detail.classList.toggle('is-showing-event', showsEventDetail);
    if (!showsEventDetail) {
      document.querySelector('.sidebar').classList.remove('is-showing-event');
    }
    if (showsEvents) renderEvents();
    if (showsEventDetail) renderEventDetail();
    detailLink.hidden = showsEvents || !place.source;
    if (place.source) {
      detailLink.href = place.source;
    } else {
      detailLink.removeAttribute('href');
    }
  }

  function refreshLanguage() {
    updateSelectedPlace();
    updateCaption();
    if (placePopup && places[state.selected]?.coordinates) {
      showPlacePopup(state.selected);
    }
    markerElements.forEach((element, id) => {
      const name = placeName(places[id]);
      element.setAttribute(
        'aria-label',
        t('showPlace', { place: name }),
      );
      element.querySelector('.marker-label').textContent = name;
    });
  }

  function selectPlace(id, fly = true, scrollSidebar = false) {
    const place = places[id];
    if (!place) return;
    state.selected = id;
    state.view = place.bounds ? 'project-area' : 'campus';
    state.caption = 'place';
    if (place.projectAreaId) onSelectProjectArea?.(place.projectAreaId);
    updateSelectedPlace();
    updateCaption();
    setActiveButtons('.place-item', id, 'data-place');
    setActiveButtons(
      '.map-actions button',
      id === 'tegeler-stadtheide' ? 'stadtheide-view' : null,
      'id',
    );
    markerElements.forEach((element, key) =>
      element.classList.toggle('is-selected', key === id),
    );
    if (scrollSidebar) {
      requestAnimationFrame(() => {
        document
          .querySelector('.places-section')
          .scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (fly) {
      if (place.bounds) {
        map.fitBounds(place.bounds, {
          padding: airportViewPadding(),
          pitch: state.dimension === '3d' ? 45 : 0,
          bearing: state.dimension === '3d' ? -12 : 0,
          duration: 1200,
          essential: true,
        });
      } else {
        map.flyTo({
          center: place.coordinates,
          zoom: state.dimension === '3d' ? 16.65 : 16.3,
          pitch: state.dimension === '3d' ? 60 : 0,
          bearing: state.dimension === '3d' ? -24 : 0,
          offset:
            id === 'zelt' && window.innerWidth <= 700
              ? [0, Math.round(Math.min(110, window.innerHeight * 0.12))]
              : [0, 0],
          speed: 0.8,
          essential: true,
        });
      }
    }
    if (place.coordinates) showPlacePopup(id);
    else closePlacePopup();
  }

  function setPlacesVisible(visible) {
    state.PlacesVisible = visible;
    const toggle = document.getElementById('terminal-places-toggle');
    toggle.classList.toggle('is-active', visible);
    toggle.setAttribute('aria-checked', String(visible));
    document.getElementById('terminal-places').hidden = !visible;
    markerElements.forEach((element, id) => {
      if (!places[id].projectAreaId) element.hidden = !visible;
    });
    if (!visible && !places[state.selected].projectAreaId) {
      selectPlace('tegeler-stadtheide', false);
    }
  }

  function setDimension(dimension) {
    state.dimension = dimension;
    setActiveButtons('.view-switch button', 'view-' + dimension, 'id');
    if (map.getLayer('txl-3d-buildings')) {
      map.setLayoutProperty(
        'txl-3d-buildings',
        'visibility',
        dimension === '3d' ? 'visible' : 'none',
      );
    }
    if (state.view === 'airport') {
      showAirport();
    } else {
      map.easeTo({
        pitch: dimension === '3d' ? 58 : 0,
        bearing: dimension === '3d' ? -24 : 0,
        duration: 750,
      });
    }
  }

  function showAirport() {
    state.view = 'airport';
    state.caption = 'airport';
    closePlacePopup();
    setActiveButtons('.map-actions button', 'airport-view', 'id');
    updateCaption();
    map.fitBounds(airportBounds, {
      padding: airportViewPadding(),
      pitch: state.dimension === '3d' ? 48 : 0,
      bearing: state.dimension === '3d' ? -15 : 0,
      duration: 1200,
      essential: true,
    });
  }

  function constrainAirportView() {
    const overviewCamera = map.cameraForBounds(airportBounds, {
      padding: airportViewPadding(),
    });
    if (overviewCamera) map.setMinZoom(overviewCamera.zoom);
  }

  function addBuildingLayer() {
    map.addSource('txl-buildings', {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    });
    const firstLabel = map
      .getStyle()
      .layers.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field'],
      )?.id;
    map.addLayer(
      {
        id: 'txl-3d-buildings',
        source: 'txl-buildings',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14.5,
        filter: ['!=', ['get', 'hide_3d'], true],
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['get', 'render_height'],
            0,
            '#b4c2bd',
            30,
            '#8daea9',
            80,
            '#577b7e',
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14.5,
            0,
            15.5,
            ['coalesce', ['get', 'render_height'], 8],
          ],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.88,
        },
      },
      firstLabel,
    );
  }

  async function loadEvents() {
    state.eventsStatus = 'loading';
    if (state.selected === 'zelt') {
      renderEvents();
      if (placePopup) showPlacePopup('zelt');
    }
    try {
      const response = await fetch(
        '/data/campus_stadt_natur_tegeler_stadtheide_events.json',
      );
      if (!response.ok)
        throw new Error(
          `Event data request failed with status ${response.status}`,
        );
      const events = await response.json();
      if (!Array.isArray(events))
        throw new Error('Event data must be an array');
      state.events = events.sort(
        (a, b) => new Date(a.start) - new Date(b.start),
      );
      state.eventsStatus = 'ready';
    } catch (error) {
      console.error('Could not load event data.', error);
      state.eventsStatus = 'error';
    }
    if (state.selected === 'zelt') {
      renderEvents();
      if (placePopup) showPlacePopup('zelt');
    }
  }

  function addMarkers() {
    for (const [id, place] of Object.entries(places)) {
      if (!place.coordinates) continue;
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = [
        'map-marker',
        id === 'zelt' ? 'map-marker--tent' : '',
        id === state.selected ? 'is-selected' : '',
      ]
        .filter(Boolean)
        .join(' ');
      marker.hidden = !place.projectAreaId && !state.PlacesVisible;
      marker.setAttribute(
        'aria-label',
        t('showPlace', { place: placeName(place) }),
      );
      const markerGraphic =
        id === 'zelt'
          ? `<span class="marker-core marker-core--tent" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <path d="M3 26 14.2 6.6a2.1 2.1 0 0 1 3.6 0L29 26H3Z" />
              <path d="m16 8.5 5.5 17.5h-11L16 8.5Z" />
              <path d="M16 8.5V4" />
            </svg>
          </span>`
          : '<span class="marker-core" aria-hidden="true"></span>';
      marker.innerHTML = `${markerGraphic}<span class="marker-label">${placeName(place)}</span>`;
      marker.addEventListener('click', () => selectPlace(id));
      markerElements.set(id, marker);
      new maplibregl.Marker({
        element: marker,
        anchor: 'center',
        pitchAlignment: 'viewport',
        rotationAlignment: 'viewport',
        subpixelPositioning: true,
      })
        .setLngLat(place.coordinates)
        .addTo(map);
    }
  }

  function bindUi() {
    document.querySelectorAll('.place-item').forEach((button) => {
      button.addEventListener('click', () =>
        selectPlace(button.dataset.place, true, true),
      );
    });
    document
      .getElementById('view-2d')
      .addEventListener('click', () => setDimension('2d'));
    document
      .getElementById('view-3d')
      .addEventListener('click', () => setDimension('3d'));
    document.getElementById('stadtheide-view').addEventListener('click', () => {
      selectPlace('tegeler-stadtheide');
    });
    document
      .getElementById('terminal-places-toggle')
      .addEventListener('click', () => {
        setPlacesVisible(!state.PlacesVisible);
      });
    document
      .getElementById('airport-view')
      .addEventListener('click', showAirport);
  }

  function addTrees() {
    const beforeLayerId = 'txl-3d-buildings';

    map.addSource('baeume', {
      type: 'geojson',
      data: '/data/baeume.geojson',
    });

    map.addLayer({
      id: 'baeume-fill',
      type: 'fill',
      source: 'baeume',
      minzoom: 15,
      paint: {
        'fill-color': ['get', 'farbe'],
        'fill-opacity': 0.55,
      },
    }, beforeLayerId);

    map.addLayer({
      id: 'baeume-outline',
      type: 'line',
      source: 'baeume',
      minzoom: 15,
      paint: {
        'line-color': ['get', 'farbe'],
        'line-width': 0.8,
      },
    }, beforeLayerId);

    map.addLayer({
      id: 'baeume-auffaellig',
      type: 'line',
      source: 'baeume',
      minzoom: 15,
      filter: ['to-boolean', ['get', 'auffaellig']],
      paint: {
        'line-color': '#d00000',
        'line-width': 2.5,
      },
    }, beforeLayerId);

    map.on('click', 'baeume-fill', (event) => {
      const p = event.features[0].properties;
      const lines = [
        `<strong>${t('treeTitle', { id: p.id })}</strong>`,
        t('treeHeight', { height: p.hoehe_m }),
        t('treeCrownDiameter', { diameter: p.durchm_m }),
        t('treeGreenness', { value: p.gcc ?? '–' }),
      ];
      if (p.auffaellig) {
        lines.push(`<strong style="color:#d00000">${t('treeConspicuous')}</strong>`);
      }
      new maplibregl.Popup({ offset: 10 })
        .setLngLat(event.lngLat)
        .setHTML(lines.join('<br>'))
        .addTo(map);
    });

    map.on('mouseenter', 'baeume-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'baeume-fill', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  return {
    addBuildingLayer,
    addMarkers,
    bindUi,
    constrainAirportView,
    loadEvents,
    refreshLanguage,
    addTrees,
  };
}
