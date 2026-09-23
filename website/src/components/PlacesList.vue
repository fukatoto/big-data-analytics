<template>
  <div class="place-list">
    <div class="place-group-heading">
      <span v-i18n="['projectAreas', language]">PROJECT AREAS</span
      ><span>{{ twoDigits(projectAreaIds.length) }}</span>
    </div>
    <button
      v-for="(id, index) in projectAreaIds"
      :key="id"
      class="place-item is-project-area"
      :style="{ '--area-color': projectAreas[id].color }"
      type="button"
      :data-place="id"
      :class="{ 'is-active': selected === id }"
      :aria-pressed="String(selected === id)"
      @click="emit('select-place', id)"
    >
      <span class="place-index">{{ twoDigits(index + 1) }}</span>
      <span class="place-text">
        <strong>{{ placeName(id) }}</strong>
        <small>{{ translate(subtitleKeys[id]) }}</small>
      </span>
      <span class="place-arrow" aria-hidden="true">↗</span>
    </button>
    <button
      id="terminal-places-toggle"
      class="terminal-places-toggle"
      :class="{ 'is-active': placesVisible }"
      type="button"
      role="switch"
      :aria-checked="String(placesVisible)"
      @click="emit('toggle-places')"
    >
      <span class="terminal-places-label">
        <span class="terminal-places-title">
          <svg
            class="places-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span v-i18n="['places', language]">PLACES</span>
        </span>
        <span>{{ terminalPlaceIds.length }}</span>
      </span>
      <i aria-hidden="true"><b></b></i>
    </button>
    <div id="terminal-places" v-show="placesVisible" class="terminal-places">
      <button
        v-for="id in terminalPlaceIds"
        :key="id"
        class="place-item is-terminal-place"
        type="button"
        :data-place="id"
        :class="{ 'is-active': selected === id }"
        :aria-pressed="String(selected === id)"
        @click="emit('select-place', id)"
      >
        <span class="place-index">{{ places[id].number.slice(0, 2) }}</span>
        <span class="place-text">
          <strong>{{ placeName(id) }}</strong>
          <small>{{ translate(subtitleKeys[id]) }}</small>
        </span>
        <span class="place-arrow" aria-hidden="true">↗</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { places, projectAreas } from '../config.js';
import { translate as translateText } from '../translate.js';

const props = defineProps({
  selected: { type: String, required: true },
  placesVisible: { type: Boolean, required: true },
  language: { type: String, required: true },
});
const emit = defineEmits(['select-place', 'toggle-places']);

const projectAreaIds = Object.keys(projectAreas).sort((first, second) =>
  places[first].number.localeCompare(places[second].number),
);
const terminalPlaceIds = [
  'terminal-a',
  'terminal-b',
  'terminal-d',
  'heideblick',
  'bunker',
  'rundbogenantenne',
  'zelt',
  'northern-runway',
  'southern-runway',
  'airfield-lighting',
  'landscape-park',
  'schumacher-quartier-place',
  'sunbathing-lawn',
  'future-tree-nursery',
  'radar-plateau',
  'landscape-maintenance-hub',
  'grazing-zone',
  'heide-steg',
  'heide-tribuene',
  'runway-oase',
];
const subtitleKeys = {
  'tegeler-stadtheide': 'natureRecreationArea',
  'urban-tech-republic': 'researchInnovationSite',
  'schumacher-quartier': 'newResidentialQuarter',
  'terminal-a': 'futureCampus',
  'terminal-b': 'innovationSpace',
  'terminal-d': 'technologyCentre',
  heideblick: 'heideblickSubtitle',
  bunker: 'recreationSubtitle',
  rundbogenantenne: 'archedAntennaSubtitle',
  zelt: 'tentSubtitle',
  'northern-runway': 'northernRunwaySubtitle',
  'southern-runway': 'southernRunwaySubtitle',
  'airfield-lighting': 'airfieldLightingSubtitle',
  'landscape-park': 'landscapeParkSubtitle',
  'schumacher-quartier-place': 'newResidentialQuarter',
  'sunbathing-lawn': 'sunbathingLawnSubtitle',
  'future-tree-nursery': 'futureTreeNurserySubtitle',
  'radar-plateau': 'radarPlateauSubtitle',
  'landscape-maintenance-hub': 'landscapeMaintenanceHubSubtitle',
  'grazing-zone': 'grazingZoneSubtitle',
  'heide-steg': 'heideStegSubtitle',
  'heide-tribuene': 'heidetribueneSubtitle',
  'runway-oase': 'runwayOaseSubtitle',
};

function twoDigits(number) {
  return String(number).padStart(2, '0');
}
function translate(key) {
  return translateText(props.language, key);
}
function placeName(id) {
  const place = places[id];
  return place.nameKey ? translate(place.nameKey) : place.name;
}
</script>
