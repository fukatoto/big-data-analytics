import * as maplibregl from 'maplibre-gl';
import { airportBounds, airportViewPadding, places } from './config.js';
import {
  eventCountText,
  eventFilterOptions,
  eventLocale,
  eventsCalendarUrl,
  eventStatusKey,
  filterEvents,
  hasActiveEventFilters,
} from './event-utils.js';

const markerLabelPositions = [
  'bottom',
  'top',
  'right',
  'left',
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
];
const markerLabelCollisionPadding = 4;
const markerLabelViewportPadding = 6;
const markerLabelGap = 4;

function rectanglesOverlap(first, second, padding = 0) {
  return (
    first.left < second.right + padding &&
    first.right > second.left - padding &&
    first.top < second.bottom + padding &&
    first.bottom > second.top - padding
  );
}

function rectangleOverlapArea(first, second, padding = 0) {
  const width = Math.min(first.right, second.right + padding) -
    Math.max(first.left, second.left - padding);
  const height = Math.min(first.bottom, second.bottom + padding) -
    Math.max(first.top, second.top - padding);
  return Math.max(0, width) * Math.max(0, height);
}

function markerLabelRectangle(marker, label, position) {
  const markerCenterX = marker.left + marker.width / 2;
  const markerCenterY = marker.top + marker.height / 2;
  let left = markerCenterX - label.width / 2;
  let top = marker.bottom + markerLabelGap;

  if (position === 'top') {
    top = marker.top - markerLabelGap - label.height;
  } else if (position === 'right') {
    left = marker.right + markerLabelGap;
    top = markerCenterY - label.height / 2;
  } else if (position === 'left') {
    left = marker.left - markerLabelGap - label.width;
    top = markerCenterY - label.height / 2;
  } else if (position === 'bottom-right') {
    left = markerCenterX;
  } else if (position === 'bottom-left') {
    left = markerCenterX - label.width;
  } else if (position === 'top-right') {
    left = markerCenterX;
    top = marker.top - markerLabelGap - label.height;
  } else if (position === 'top-left') {
    left = markerCenterX - label.width;
    top = marker.top - markerLabelGap - label.height;
  }

  return {
    top,
    right: left + label.width,
    bottom: top + label.height,
    left,
    width: label.width,
    height: label.height,
  };
}

export function createMapController({ map, t, onSelectProjectArea, onEventFilterChange, state }) {
  const markerElements = new Map();
  let placePopup = null;
  let markerLabelLayoutFrame = null;
  let markerLabelLayoutBound = false;

  function placeName(place) {
    return place.nameKey ? t(place.nameKey) : place.name;
  }

  function markerLabelOverflow(rectangle, viewport) {
    return (
      Math.max(0, viewport.left + markerLabelViewportPadding - rectangle.left) +
      Math.max(0, rectangle.right - viewport.right + markerLabelViewportPadding) +
      Math.max(0, viewport.top + markerLabelViewportPadding - rectangle.top) +
      Math.max(0, rectangle.bottom - viewport.bottom + markerLabelViewportPadding)
    );
  }

  function layoutMarkerLabels() {
    const visibleMarkers = [...markerElements.entries()]
      .filter(([, element]) => !element.hidden && element.offsetParent)
      .map(([id, element]) => ({
        id,
        element,
        marker: element.getBoundingClientRect(),
        point: element.querySelector('.marker-core').getBoundingClientRect(),
      }))
      .sort((first, second) => {
        const selectedDifference =
          Number(second.id === state.selected) - Number(first.id === state.selected);
        if (selectedDifference) return selectedDifference;
        return first.point.top - second.point.top || first.point.left - second.point.left;
      });
    if (!visibleMarkers.length) return;

    const viewport = map.getContainer().getBoundingClientRect();
    const occupiedLabels = [];

    visibleMarkers.forEach(({ element, marker, point }) => {
      const label = element.querySelector('.marker-label');
      const labelSize = label.getBoundingClientRect();
      const otherPoints = visibleMarkers
        .map((marker) => marker.point)
        .filter((otherPoint) => otherPoint !== point);
      const currentPosition = element.dataset.labelPosition ?? 'bottom';
      const positionPreferences = [
        currentPosition,
        ...markerLabelPositions.filter((position) => position !== currentPosition),
      ];
      let bestCandidate = null;

      for (const position of positionPreferences) {
        const rectangle = markerLabelRectangle(marker, labelSize, position);
        const collides = [...occupiedLabels, ...otherPoints].some((occupied) =>
          rectanglesOverlap(
            rectangle,
            occupied,
            markerLabelCollisionPadding,
          ),
        );
        const overflow = markerLabelOverflow(rectangle, viewport);

        if (!collides && overflow === 0) {
          bestCandidate = { position, rectangle, score: 0 };
          break;
        }

        const overlapArea = [...occupiedLabels, ...otherPoints].reduce(
          (total, occupied) =>
            total +
            rectangleOverlapArea(
              rectangle,
              occupied,
              markerLabelCollisionPadding,
            ),
          0,
        );
        const score = overlapArea + overflow * 100;
        if (!bestCandidate || score < bestCandidate.score) {
          bestCandidate = { position, rectangle, score };
        }
      }

      element.dataset.labelPosition = bestCandidate.position;
      occupiedLabels.push(bestCandidate.rectangle);
    });
  }

  function scheduleMarkerLabelLayout() {
    if (markerLabelLayoutFrame !== null) return;
    markerLabelLayoutFrame = requestAnimationFrame(() => {
      markerLabelLayoutFrame = null;
      layoutMarkerLabels();
    });
  }

  function filteredEvents() {
    return filterEvents(state.events, state.eventFilters);
  }

  function filteredEventCountText() {
    const visibleCount = filteredEvents().length;
    return eventCountText(t, visibleCount, state.events.length);
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
      onEventFilterChange({ key, value: select.value });
    });
    return select;
  }

  function createEventFilters() {
    const controls = document.createElement('div');
    controls.className = 'event-filter-controls';
    const options = eventFilterOptions(state.events);
    controls.append(
      createFilterSelect({
        key: 'status',
        labelKey: 'filterByStatus',
        allKey: 'allStatuses',
        values: options.status,
        formatValue: (value) => {
          const statusKey = eventStatusKey(value);
          return statusKey ? t(statusKey) : value;
        },
      }),
      createFilterSelect({
        key: 'format',
        labelKey: 'filterByFormat',
        allKey: 'allFormats',
        values: options.format,
      }),
      createFilterSelect({
        key: 'targetGroup',
        labelKey: 'filterByTargetGroup',
        allKey: 'allTargetGroups',
        values: options.targetGroup,
      }),
    );
    const filtersActive = hasActiveEventFilters(state.eventFilters);
    controls.classList.toggle('has-active-filters', filtersActive);
    if (filtersActive) {
      const reset = document.createElement('button');
      reset.className = 'event-filter-reset';
      reset.type = 'button';
      reset.textContent = t('resetFilters');
      reset.addEventListener('click', () => {
        onEventFilterChange({ type: 'reset' });
      });
      controls.append(reset);
    }
    return controls;
  }

  function showEventDetail(event) {
    state.selectedEventUrl = event.source_url;
    closePlacePopup();
    requestAnimationFrame(() => {
      document.querySelector('.sidebar').scrollTo({ top: 0, behavior: 'smooth' });
      document.getElementById('event-detail-title')?.focus({ preventScroll: true });
    });
  }

  function selectEvent(url) {
    const event = state.events.find((item) => item.source_url === url);
    if (event) showEventDetail(event);
  }

  function closeEventDetail() {
    state.selectedEventUrl = null;
    if (state.selected === 'zelt') {
      requestAnimationFrame(() => {
        document
          .getElementById('event-overview-title')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function refreshEventViews() {
    if (placePopup && state.selected === 'zelt') {
      placePopup.setDOMContent(createTentPopupContent());
    }
  }

  function placeDescription(place) {
    return place.descriptionKey
      ? t(place.descriptionKey)
      : (place.description ?? '');
  }

  function createLocationLink(place) {
    const [longitude, latitude] = place.coordinates;
    const link = document.createElement('a');
    link.className = 'place-popup-location';
    link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const label = t('openPlaceOnMap', { place: placeName(place) });
    link.setAttribute('aria-label', label);
    link.title = label;
    link.append(document.querySelector('.places-icon').cloneNode(true));
    return link;
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
    const heading = document.createElement('div');
    heading.className = 'place-popup-heading';
    const title = document.createElement('h3');
    title.textContent = placeName(place);
    heading.append(title, createLocationLink(place));
    const description = document.createElement('p');
    description.textContent = placeDescription(place);
    body.append(heading, description);
    content.append(body);
    return content;
  }

  function createTentPopupContent() {
    const language = document.documentElement.lang || 'de';
    const locale = eventLocale(language);
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
        ? filteredEventCountText()
        : '';
    const headingTitle = document.createElement('div');
    headingTitle.className = 'tent-popup-heading-title';
    headingTitle.append(title, createLocationLink(places.zelt));
    const headingActions = document.createElement('div');
    headingActions.className = 'tent-popup-heading-actions';
    headingActions.append(count);
    heading.append(headingTitle, headingActions);
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
    const popup = new maplibregl.Popup({
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
    placePopup = popup;
    markerElements.get(id)?.classList.add('is-selected');
    popup.on('close', () => {
      if (placePopup !== popup) return;
      markerElements.get(id)?.classList.remove('is-selected');
      scheduleMarkerLabelLayout();
      placePopup = null;
    });
  }

  function closePlacePopup() {
    placePopup?.remove();
    placePopup = null;
  }

  function refreshLanguage() {
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
    scheduleMarkerLabelLayout();
  }

  function selectPlace(id, fly = true, scrollSidebar = false) {
    const place = places[id];
    if (!place) return;
    state.selected = id;
    state.view = place.bounds ? 'project-area' : 'campus';
    state.caption = 'place';
    if (place.projectAreaId) onSelectProjectArea?.(place.projectAreaId);
    if (id !== 'zelt') state.selectedEventUrl = null;
    requestAnimationFrame(() => map.resize());
    markerElements.forEach((element, key) =>
      element.classList.toggle('is-selected', key === id),
    );
    scheduleMarkerLabelLayout();
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
    state.placesVisible = visible;
    markerElements.forEach((element, id) => {
      if (!places[id].projectAreaId) element.hidden = !visible;
    });
    scheduleMarkerLabelLayout();
    if (!visible && !places[state.selected].projectAreaId) {
      selectPlace('tegeler-stadtheide', false);
    }
  }

  function setDimension(dimension) {
    state.dimension = dimension;
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
      marker.dataset.labelPosition = 'bottom';
      marker.hidden = !place.projectAreaId && !state.placesVisible;
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
    if (!markerLabelLayoutBound) {
      markerLabelLayoutBound = true;
      map.on('move', scheduleMarkerLabelLayout);
      map.on('resize', scheduleMarkerLabelLayout);
      document.fonts?.ready.then(scheduleMarkerLabelLayout);
    }
    scheduleMarkerLabelLayout();
  }

  return {
    addBuildingLayer,
    addMarkers,
    constrainAirportView,
    loadEvents,
    refreshLanguage,
    selectPlace,
    setPlacesVisible,
    setDimension,
    showAirport,
    selectEvent,
    closeEvent: closeEventDetail,
    refreshEventPopup: refreshEventViews,
  };
}
