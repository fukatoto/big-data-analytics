<template>
  <section
    id="event-overview"
    v-show="!selectedEvent"
    class="event-overview"
    aria-labelledby="event-overview-title"
  >
    <div class="event-overview-heading">
      <h3 id="event-overview-title">
        <a
          class="events-heading-link"
          :href="eventsCalendarUrl"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('eventsCalendarOpen')"
        ><span id="event-overview-link-label">{{ t('eventsAtTent') }}</span><span class="events-heading-arrow" aria-hidden="true">↗</span></a>
      </h3>
      <span id="event-count">{{ eventCount }}</span>
    </div>
    <div id="event-filters">
      <div
        v-if="atlas.eventsStatus === 'ready'"
        class="event-filter-controls"
        :class="{ 'has-active-filters': filtersActive }"
      >
        <select :value="atlas.eventFilters.status" class="event-filter-select" :aria-label="t('filterByStatus')" @change="emit('filter-change', { key: 'status', value: $event.target.value })">
          <option value="all">{{ t('allStatuses') }}</option>
          <option v-for="status in filterOptions.status" :key="status" :value="status">{{ statusLabel(status) }}</option>
        </select>
        <select :value="atlas.eventFilters.format" class="event-filter-select" :aria-label="t('filterByFormat')" @change="emit('filter-change', { key: 'format', value: $event.target.value })">
          <option value="all">{{ t('allFormats') }}</option>
          <option v-for="format in filterOptions.format" :key="format" :value="format">{{ format }}</option>
        </select>
        <select :value="atlas.eventFilters.targetGroup" class="event-filter-select" :aria-label="t('filterByTargetGroup')" @change="emit('filter-change', { key: 'targetGroup', value: $event.target.value })">
          <option value="all">{{ t('allTargetGroups') }}</option>
          <option v-for="group in filterOptions.targetGroup" :key="group" :value="group">{{ group }}</option>
        </select>
        <button v-if="filtersActive" class="event-filter-reset" type="button" @click="resetFilters">{{ t('resetFilters') }}</button>
      </div>
    </div>
    <div id="event-list" class="event-list">
      <p v-if="atlas.eventsStatus !== 'ready'" class="event-message" :class="{ 'is-error': atlas.eventsStatus === 'error' }">
        {{ t(atlas.eventsStatus === 'error' ? 'eventsLoadError' : 'eventsLoading') }}
      </p>
      <p v-else-if="!filteredEvents.length" class="event-message">{{ t('eventsNoResults') }}</p>
      <button
        v-for="event in filteredEvents"
        v-else
        :key="event.source_url"
        class="event-card"
        type="button"
        :aria-label="t('eventOpen', { event: event.title })"
        @click="emit('select-event', event.source_url)"
      >
        <span class="event-card-visual" :class="{ 'has-image-error': imageErrors.includes(event.source_url) }">
          <img :src="event.cover_image_url" alt="" loading="lazy" @error="markImageError(event.source_url)" />
          <span class="event-date"><strong>{{ datePart(event.start, 'day') }}</strong><span>{{ datePart(event.start, 'month').replace('.', '') }}</span></span>
        </span>
        <span class="event-card-content">
          <span class="event-card-topline">
            <span class="event-format">{{ event.format }}</span>
            <span class="event-status" :class="statusClass(event.status)">{{ statusLabel(event.status) }}</span>
          </span>
          <strong class="event-title">{{ event.title }}</strong>
          <span class="event-meta">{{ time(event.start) }}–{{ time(event.end) }} · {{ event.price }}</span>
        </span>
      </button>
    </div>
  </section>

  <section
    id="event-detail"
    v-if="selectedEvent"
    class="event-detail"
    aria-labelledby="event-detail-title"
  >
    <button class="event-detail-back" type="button" :aria-label="t('eventBackToOverview')" @click="emit('close-event')">
      <span aria-hidden="true">←</span><span>{{ t('eventBackToOverview') }}</span>
    </button>
    <figure v-if="coverVisible" class="event-detail-cover">
      <img :src="selectedEvent.cover_image_url" :alt="selectedEvent.cover_image_alt ?? ''" decoding="async" @error="coverVisible = false" />
      <figcaption v-if="selectedEvent.cover_image_credit">© {{ selectedEvent.cover_image_credit }}</figcaption>
    </figure>
    <div class="event-detail-eyebrow">
      <span>{{ selectedEvent.format }}</span>
      <span class="event-status" :class="statusClass(selectedEvent.status)">{{ statusLabel(selectedEvent.status) }}</span>
    </div>
    <h2 id="event-detail-title" tabindex="-1">{{ selectedEvent.title }}</h2>
    <div class="event-detail-schedule">
      <span class="event-detail-schedule-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg></span>
      <span class="event-detail-schedule-text"><time :datetime="selectedEvent.start">{{ fullDate(selectedEvent.start) }}</time><span>{{ time(selectedEvent.start) }}–{{ time(selectedEvent.end) }}</span></span>
    </div>
    <dl class="event-detail-facts">
      <div v-for="fact in facts" :key="fact.key" :class="{ 'event-detail-fact-compact': fact.compact }">
        <dt>{{ t(fact.key) }}</dt><dd>{{ fact.value }}</dd>
      </div>
    </dl>
    <div class="event-detail-actions">
      <a class="event-detail-link" :href="selectedEvent.source_url" target="_blank" rel="noopener noreferrer">
        <span>{{ t(eventStatusKey(selectedEvent.status) === 'eventSoldOut' ? 'eventMoreInformationOnly' : 'eventMoreInformation') }}</span><span aria-hidden="true">↗</span>
      </a>
      <button class="event-detail-calendar" type="button" @click="downloadCalendarFile(selectedEvent)">
        <span>{{ t('eventAddToCalendar') }}</span><span aria-hidden="true">↓</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import {
  downloadCalendarFile,
  eventCountText,
  eventFilterOptions,
  eventLocale,
  eventStatusKey,
  eventsCalendarUrl,
  filterEvents,
  hasActiveEventFilters,
} from '../event-utils.js';
import { translate } from '../translate.js';

const props = defineProps({
  atlas: { type: Object, required: true },
  language: { type: String, required: true },
});
const emit = defineEmits(['filter-change', 'select-event', 'close-event']);
const imageErrors = ref([]);
const coverVisible = ref(true);
const locale = computed(() => eventLocale(props.language));
const selectedEvent = computed(() => props.atlas.events.find((event) => event.source_url === props.atlas.selectedEventUrl));
const filterOptions = computed(() => eventFilterOptions(props.atlas.events));
const filtersActive = computed(() => hasActiveEventFilters(props.atlas.eventFilters));
const filteredEvents = computed(() => filterEvents(props.atlas.events, props.atlas.eventFilters));
const eventCount = computed(() => {
  if (props.atlas.eventsStatus !== 'ready') return '';
  return eventCountText(t, filteredEvents.value.length, props.atlas.events.length);
});
const facts = computed(() => [
  { key: 'eventLocation', value: selectedEvent.value?.location, compact: true },
  { key: 'eventTargetGroups', value: selectedEvent.value?.target_groups?.join(' · '), compact: true },
  { key: 'eventMeetingPoint', value: selectedEvent.value?.meeting_point },
  { key: 'eventPrice', value: selectedEvent.value?.price },
  { key: 'eventProvider', value: selectedEvent.value?.provider },
].filter((fact) => fact.value));

watch(selectedEvent, () => { coverVisible.value = true; });

function t(key, variables) { return translate(props.language, key, variables); }
function statusLabel(status) { const key = eventStatusKey(status); return key ? t(key) : status; }
function statusClass(status) { return eventStatusKey(status) === 'eventAvailable' ? 'is-available' : 'is-sold-out'; }
function datePart(value, part) {
  return new Intl.DateTimeFormat(locale.value, { day: '2-digit', month: 'short' })
    .formatToParts(new Date(value)).find((item) => item.type === part)?.value ?? '';
}
function fullDate(value) {
  return new Intl.DateTimeFormat(locale.value, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
}
function time(value) {
  return new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
function markImageError(url) {
  if (!imageErrors.value.includes(url)) imageErrors.value = [...imageErrors.value, url];
}
function resetFilters() {
  emit('filter-change', { type: 'reset' });
}
</script>
