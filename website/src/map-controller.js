import * as maplibregl from 'maplibre-gl';
import { airportBounds, airportViewPadding, places } from './config.js';

export function createMapController({ map, t, onSelectProjectArea }) {
  const state = {
    dimension: '3d',
    view: 'campus',
    caption: 'campus',
    selected: 'tegeler-stadtheide',
    PlacesVisible: false,
    events: [],
    eventsStatus: 'loading',
  };
  const markerElements = new Map();
  let tentPopup = null;

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
    const card = document.createElement('a');
    card.className = 'event-card';
    card.href = event.source_url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', t('eventOpen', { event: event.title }));

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
    card.append(date, content);
    return card;
  }

  function renderEvents() {
    const title = document.getElementById('event-overview-title');
    const count = document.getElementById('event-count');
    const list = document.getElementById('event-list');
    title.textContent = t('eventsAtTent');
    count.textContent =
      state.eventsStatus === 'ready'
        ? t('eventCount', { count: state.events.length })
        : '';
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
    state.events.forEach((event) => list.append(createEventCard(event)));
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
    const title = document.createElement('strong');
    title.textContent = t('eventsAtTent');
    const count = document.createElement('span');
    count.textContent =
      state.eventsStatus === 'ready'
        ? t('eventCount', { count: state.events.length })
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

    const list = document.createElement('div');
    list.className = 'tent-popup-list';
    state.events.forEach((event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const statusKey = eventStatusKey(event.status);
      const link = document.createElement('a');
      link.className = 'tent-popup-event';
      link.href = event.source_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', t('eventOpen', { event: event.title }));
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

  function showTentPopup() {
    tentPopup?.remove();
    tentPopup = new maplibregl.Popup({
      anchor: window.innerWidth <= 700 ? 'top' : 'bottom-left',
      className: 'tent-events-map-popup',
      closeButton: true,
      closeOnClick: false,
      closeOnMove: false,
      focusAfterOpen: false,
      maxWidth: 'min(340px, calc(100vw - 28px))',
      offset: window.innerWidth <= 700 ? 24 : 20,
    })
      .setLngLat(places.zelt.coordinates)
      .setDOMContent(createTentPopupContent())
      .addTo(map);
    tentPopup.on('close', () => {
      tentPopup = null;
    });
  }

  function closeTentPopup() {
    tentPopup?.remove();
    tentPopup = null;
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
    const showsEvents = state.selected === 'zelt';
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
    detailDescription.textContent = place.descriptionKey
      ? t(place.descriptionKey)
      : (place.description ?? '');
    detailDescription.hidden = showsEvents;
    eventOverview.hidden = !showsEvents;
    if (showsEvents) renderEvents();
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
    if (tentPopup) showTentPopup();
    markerElements.forEach((element, id) => {
      element.setAttribute(
        'aria-label',
        t('showPlace', { place: placeName(places[id]) }),
      );
    });
  }

  function selectPlace(id, fly = true) {
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
    if (id === 'zelt') {
      requestAnimationFrame(() => {
        document
          .getElementById('place-detail')
          .scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      closeTentPopup();
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
          speed: 0.8,
          essential: true,
        });
      }
    }
    if (id === 'zelt') showTentPopup();
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
    closeTentPopup();
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
      if (tentPopup) showTentPopup();
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
      if (tentPopup) showTentPopup();
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
      button.addEventListener('click', () => selectPlace(button.dataset.place));
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

  return {
    addBuildingLayer,
    addMarkers,
    bindUi,
    constrainAirportView,
    loadEvents,
    refreshLanguage,
  };
}
