<template>
  <div
    id="place-detail"
    class="place-detail"
    :class="{ 'has-events': showsEvents, 'is-showing-event': Boolean(selectedEvent) }"
    aria-live="polite"
  >
    <div class="detail-kicker">
      <span id="detail-kicker-label">{{ t(place.projectAreaId ? 'selectedProjectArea' : 'selectedPlace') }}</span>
      <span id="detail-number">{{ place.number }}</span>
    </div>
    <h2 id="detail-title">{{ placeName }}</h2>
    <p id="detail-description" v-show="!showsEvents">{{ description }}</p>
    <a
      id="detail-link"
      v-show="!showsEvents && Boolean(place.source)"
      :href="place.source || undefined"
      target="_blank"
      rel="noopener noreferrer"
    ><span>{{ t('projectInformation') }}</span><span aria-hidden="true">↗</span></a>
    <EventsView
      v-if="showsEvents"
      :atlas="atlas"
      :language="language"
      @filter-change="(action) => emit('filter-change', action)"
      @select-event="(url) => emit('select-event', url)"
      @close-event="emit('close-event')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { places } from '../config.js';
import { translate } from '../translate.js';
import EventsView from './EventsView.vue';

const props = defineProps({
  atlas: { type: Object, required: true },
  language: { type: String, required: true },
});
const emit = defineEmits(['filter-change', 'select-event', 'close-event']);
const place = computed(() => places[props.atlas.selected] ?? places['tegeler-stadtheide']);
const placeName = computed(() => place.value.nameKey ? t(place.value.nameKey) : place.value.name);
const description = computed(() => place.value.descriptionKey ? t(place.value.descriptionKey) : (place.value.description ?? ''));
const showsEvents = computed(() => props.atlas.selected === 'zelt');
const selectedEvent = computed(() => props.atlas.events.find((event) => event.source_url === props.atlas.selectedEventUrl));

function t(key, variables) { return translate(props.language, key, variables); }
</script>
