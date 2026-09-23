<template>
      <main
        class="map-stage relative min-w-0 overflow-hidden"
        aria-label="Interactive map of Berlin TXL"
        v-i18n-aria="['mapStageLabel', language]"
      >
        <div
          id="map"
          class="absolute inset-0"
          aria-label="Map of the former Tegel Airport terminal area"
          v-i18n-aria="['mapLabel', language]"
        ></div>
        <div class="map-tint" aria-hidden="true"></div>
        <div class="map-topbar absolute flex items-start justify-between gap-4">
          <div class="location-pill flex items-center gap-2.25 whitespace-nowrap">
            <span class="pulse-dot" aria-hidden="true"></span>
            <span v-i18n="['location', language]">BERLIN, GERMANY</span>
            <span class="pill-separator">/</span>
            <span id="map-coordinates">{{ coordinates }}</span>
          </div>
          <div class="topbar-actions flex items-center gap-1.75">
            <label class="language-control">
              <span class="sr-only" v-i18n="['language', language]">Language</span>
              <select
                id="language-select"
                :value="language"
                @change="changeLanguage"
                aria-label="Language"
                v-i18n-aria="['language', language]"
              >
                <option value="de">DE</option>
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </label>
            <button
              id="theme-toggle"
              class="basemap-toggle theme-toggle"
              type="button"
              @click="toggleTheme"
              :aria-pressed="String(theme === 'dark')"
              :aria-label="translate(theme === 'dark' ? 'darkModeDisable' : 'darkModeEnable')"
              :title="translate(theme === 'dark' ? 'darkModeDisable' : 'darkModeEnable')"
            >
              <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
                <mask id="theme-moon-cutout">
                  <rect width="24" height="24" fill="white" />
                  <circle cx="17" cy="8" r="7.5" fill="black" />
                </mask>
                <circle cx="11.5" cy="12.5" r="9" mask="url(#theme-moon-cutout)" />
              </svg>
              <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
            </button>
            <button
              id="bee-mode-toggle"
              class="basemap-toggle bee-mode-toggle"
              :class="{ 'is-active': beeModeEnabled }"
              type="button"
              @click="emit('toggle-bee-mode')"
              :aria-pressed="String(beeModeEnabled)"
              :aria-label="translate(beeModeEnabled ? 'beeModeDisable' : 'beeModeEnable')"
              :title="translate(beeModeEnabled ? 'beeModeDisable' : 'beeModeEnable')"
            >
              <img
                class="basemap-toggle-icon bee-mode-toggle-icon"
                src="/src/assets/bee-cursor.svg"
                alt=""
                aria-hidden="true"
              />
              <span class="sr-only" v-i18n="['beeMode', language]">Bee mode</span>
            </button>
            <button
              id="satellite-toggle"
              class="basemap-toggle"
              :class="{ 'is-active': satelliteVisible }"
              type="button"
              @click="emit('toggle-satellite')"
              :aria-pressed="String(satelliteVisible)"
              :aria-label="translate('satelliteView')"
              :title="translate('satelliteView')"
            >
              <svg
                class="basemap-toggle-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m5.6 3.8 4.9 4.9-1.8 1.8-4.9-4.9 1.8-1.8Zm12.8 14.6-4.9-4.9 1.8-1.8 4.9 4.9-1.8 1.8ZM7.5 15.2l1.3 1.3-3.1 3.1-1.3-1.3 3.1-3.1Zm9-10.8 3.1 3.1-1.3 1.3-3.1-3.1 1.3-1.3Z" />
                <path d="M14.8 4.7a3.1 3.1 0 0 1 4.5 4.5l-7.6 7.6a3.1 3.1 0 0 1-4.5-4.5l7.6-7.6Zm.9 2.2-6.3 6.3a1 1 0 0 0 1.4 1.4l6.3-6.3a1 1 0 1 0-1.4-1.4Z" />
              </svg>
              <span class="basemap-toggle-label" v-i18n="['satellite', language]"
                >Satellite</span
              >
            </button>
            <div
              class="view-switch"
              role="group"
              aria-label="Map dimension"
              v-i18n-aria="['mapDimension', language]"
            >
              <button id="view-2d" type="button" :class="{ 'is-active': atlas.dimension === '2d' }" :aria-pressed="String(atlas.dimension === '2d')" @click="emit('set-dimension', '2d')">
                2D
              </button>
              <button
                id="view-3d"
                :class="{ 'is-active': atlas.dimension === '3d' }"
                type="button"
                :aria-pressed="String(atlas.dimension === '3d')"
                @click="emit('set-dimension', '3d')"
              >
                3D
              </button>
            </div>
          </div>
        </div>
        <div class="map-caption" id="map-caption">
          <span class="caption-line" aria-hidden="true"></span
          ><span>{{ captionNumber }} <span class="caption-slash">/</span> {{ captionLabel }}</span>
        </div>
        <section
          class="project-area-control mobile-map-panel is-desktop-collapsed"
          aria-labelledby="project-area-control-title"
        >
          <button
            class="mobile-panel-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="project-area-panel-body"
            aria-label="Project areas"
            v-i18n-aria="['projectAreas', language]"
          >
            <span
              class="mobile-panel-toggle-icon is-areas"
              aria-hidden="true"
            ></span
            ><span class="mobile-panel-toggle-label" v-i18n="['projectAreas', language]">PROJECT AREAS</span
            ><span class="mobile-panel-chevron" aria-hidden="true"></span>
          </button>
          <div class="mobile-panel-body" id="project-area-panel-body">
            <div class="project-area-control-heading">
              <div>
                <span
                  class="project-area-control-kicker"
                  v-i18n="['projectAreas', language]"
                  >PROJECT AREAS</span
                >
                <h2 id="project-area-control-title" v-i18n="['selectAreas', language]">
                  Select areas
                </h2>
              </div>
              <button
                class="desktop-panel-collapse"
                type="button"
                aria-expanded="false"
                aria-controls="project-area-desktop-content"
                v-i18n-aria="['togglePanel', language]"
              ></button>
            </div>
            <div
              id="project-area-desktop-content"
              class="desktop-collapsible-content"
            >
              <div class="project-area-options">
                <button
                  v-for="[id, area] in projectAreaEntries"
                  :key="id"
                  type="button"
                  class="project-area-toggle"
                  :class="{ 'is-active': activeProjectAreas.includes(id) }"
                  :style="{ '--area-color': area.color }"
                  :data-project-area="id"
                  :aria-pressed="String(activeProjectAreas.includes(id))"
                  @click="emit('toggle-project-area', id)"
                >
                  <i aria-hidden="true"></i
                  ><span v-i18n="[area.labelKey, language]"></span
                  ><b aria-hidden="true">✓</b>
                </button>
              </div>
              <div class="project-area-bulk-actions">
                <button
                  id="show-all-project-areas"
                  type="button"
                  @click="emit('set-all-project-areas', true)"
                >
                  <svg class="bulk-action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" />
                  </svg><span v-i18n="['showAllAreas', language]">Show all</span>
                </button>
                <button
                  id="hide-all-project-areas"
                  type="button"
                  @click="emit('set-all-project-areas', false)"
                >
                  <svg class="bulk-action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 3 21 21M10.6 6.1A12 12 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.5M6.2 6.9C3.5 8.7 2 12 2 12s3.5 6 10 6a11 11 0 0 0 3.2-.5" /><path d="M10 10a2.5 2.5 0 0 0 4 4" />
                  </svg><span v-i18n="['hideAllAreas', language]">Hide all</span>
                </button>
              </div>
              <button
                id="project-area-fill-toggle"
                type="button"
                class="project-fill-toggle"
                :class="{ 'is-active': projectAreaFillVisible }"
                :aria-pressed="String(projectAreaFillVisible)"
                @click="emit('toggle-project-area-fill')"
              >
                <span v-i18n="['coloredAreaFill', language]">Colored area fill</span
                ><i aria-hidden="true"><b></b></i>
              </button>
              <p v-i18n="['projectAreaSource', language]">
                Official boundaries: Tegel Projekt GmbH / Berlin TXL
              </p>
            </div>
          </div>
        </section>
        <section
          class="height-control mobile-map-panel is-desktop-collapsed"
          aria-labelledby="height-control-title"
          hidden
        >
          <button
            class="mobile-panel-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="height-panel-body"
          >
            <span
              class="mobile-panel-toggle-icon is-height"
              aria-hidden="true"
            ></span
            ><span v-i18n="['heightTolerance', language]">Height tolerance</span
            ><span class="mobile-panel-chevron" aria-hidden="true"></span>
          </button>
          <div class="mobile-panel-body" id="height-panel-body">
            <div class="height-control-heading">
              <div>
                <span class="height-control-kicker" v-i18n="['groundAnalysis', language]"
                  >GROUND ANALYSIS</span
                >
                <h2 id="height-control-title" v-i18n="['heightTolerance', language]">
                  Height tolerance
                </h2>
              </div>
              <div class="height-control-heading-actions">
                <output id="height-threshold-value" for="height-threshold"
                  >{{ Math.round(atlas.heightAnalysis.threshold * 100) }} cm</output
                >
                <button
                  class="desktop-panel-collapse"
                  type="button"
                  aria-expanded="false"
                  aria-controls="height-desktop-content"
                  v-i18n-aria="['togglePanel', language]"
                ></button>
              </div>
            </div>
            <div
              id="height-desktop-content"
              class="desktop-collapsible-content"
            >
              <label for="height-threshold" v-i18n="['maxLocalDifference', language]"
                >Maximum local difference</label
              >
              <input
                id="height-threshold"
                type="range"
                min="0.01"
                max="0.4"
                step="0.01"
                :value="atlas.heightAnalysis.threshold"
                :disabled="!atlas.heightAnalysis.enabled"
                @input="emit('height-threshold-change', Number($event.target.value))"
              />
              <div class="height-legend" aria-live="polite">
                <span
                  ><i class="legend-swatch is-obstacle" aria-hidden="true"></i
                  ><b id="obstacle-count">{{ atlas.heightAnalysis.obstacles ?? '–' }}</b>
                  <span v-i18n="['obstacles', language]">obstacles</span></span
                >
                <span
                  ><i class="legend-swatch is-clear" aria-hidden="true"></i
                  ><b id="clear-count">{{ atlas.heightAnalysis.clear ?? '–' }}</b>
                  <span v-i18n="['clear', language]">clear</span></span
                >
              </div>
              <p id="height-data-status">{{ heightStatus }}</p>
            </div>
          </div>
        </section>
        <TreeHealthControls :filters="atlas.treeFilters" :language="language" @change="(action) => emit('tree-filter-action', action)" />
        <div
          class="map-actions absolute flex gap-1.75"
          role="group"
          aria-label="Map views"
          v-i18n-aria="['mapViews', language]"
        >
          <button id="stadtheide-view" type="button" :class="{ 'is-active': atlas.caption === 'place' && atlas.selected === 'tegeler-stadtheide' }" :aria-pressed="String(atlas.caption === 'place' && atlas.selected === 'tegeler-stadtheide')" @click="emit('show-stadtheide')">
            <span class="action-icon" aria-hidden="true">⌖</span>
            <span v-i18n="['stadtheide', language]">Stadtheide</span>
          </button>
          <button id="airport-view" type="button" :class="{ 'is-active': atlas.view === 'airport' }" :aria-pressed="String(atlas.view === 'airport')" @click="emit('show-airport')">
            <span class="action-icon" aria-hidden="true">◇</span>
            <span v-i18n="['formerAirport', language]">Former airport</span>
          </button>
        </div>
        <div class="map-help" v-i18n="['mapHelp', language]">
          Drag to explore · Ctrl + drag to rotate · Scroll to zoom
        </div>
        <div v-show="mapError" class="map-error" id="map-error" role="alert">
          <strong v-i18n="['mapLoadError', language]">The map could not load.</strong
          ><br /><span v-i18n="['mapLoadHint', language]"
            >Check your connection and reload this page.</span
          >
        </div>
      </main>
</template>

<script setup>
import { computed } from 'vue';
import { places, projectAreas } from '../config.js';
import TreeHealthControls from './TreeHealthControls.vue';
import { translate as translateText } from '../translate.js';

const props = defineProps({
  atlas: { type: Object, required: true },
  coordinates: { type: String, required: true },
  language: { type: String, required: true },
  theme: { type: String, required: true },
  mapError: { type: Boolean, required: true },
  satelliteVisible: { type: Boolean, required: true },
  beeModeEnabled: { type: Boolean, required: true },
  activeProjectAreas: { type: Array, required: true },
  projectAreaFillVisible: { type: Boolean, required: true },
});
const emit = defineEmits([
  'toggle-theme', 'change-language', 'toggle-satellite', 'toggle-bee-mode',
  'toggle-project-area', 'set-all-project-areas', 'toggle-project-area-fill',
  'set-dimension', 'show-airport', 'show-stadtheide', 'tree-filter-action',
  'height-threshold-change',
]);
const projectAreaEntries = Object.entries(projectAreas);
const heightStatus = computed(() => {
  const { error, visibleSamples } = props.atlas.heightAnalysis;
  if (error) return error.key ? translateText(props.language, error.key, error.variables) : error.message;
  return visibleSamples === null
    ? translateText(props.language, 'loadingHeightData')
    : translateText(props.language, 'dataStatus', { points: visibleSamples });
});
const captionNumber = computed(() => props.atlas.caption === 'airport'
  ? '02'
  : props.atlas.caption === 'place'
    ? places[props.atlas.selected]?.number.slice(0, 2) ?? '01'
    : '01');
const captionLabel = computed(() => props.atlas.caption === 'airport'
  ? translate('formerAirportArea')
  : props.atlas.caption === 'place'
    ? (places[props.atlas.selected]?.nameKey
        ? translate(places[props.atlas.selected].nameKey)
        : places[props.atlas.selected]?.name ?? '').toUpperCase()
    : translate('terminalCampus'));
function translate(key) { return translateText(props.language, key); }
function toggleTheme() { emit('toggle-theme'); }
function changeLanguage(event) { emit('change-language', event.target.value); }
</script>
