<template>
<div class="app-shell relative grid h-dvh overflow-hidden" :class="{ 'is-sidebar-collapsed': sidebarCollapsed, 'is-tent-selected': atlas.selected === 'zelt' }">
      <Sidebar
        :atlas="atlas"
        :language="language"
        :internal-view-open="internalViewOpen"
        :active-internal-layers="activeInternalLayers"
        @toggle-internal-view="toggleInternalView"
        @toggle-internal-layer="toggleInternalLayer"
        @set-all-internal-layers="setAllInternalLayers"
        @select-place="selectPlace"
        @toggle-places="togglePlaces"
        @filter-change="updateEventFilter"
        @select-event="selectEvent"
        @close-event="closeEvent"
      />

      <button
        id="sidebar-toggle"
        class="sidebar-toggle"
        type="button"
        @click="toggleSidebar"
        aria-controls="sidebar"
        :aria-expanded="String(!sidebarCollapsed)"
        :aria-label="translate(language, sidebarCollapsed ? 'showSidebar' : 'hideSidebar')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14.5 6-6 6 6 6" />
        </svg>
      </button>

      <MapStage
        :atlas="atlas"
        :coordinates="coordinates"
        :language="language"
        :theme="theme"
        :map-error="mapError"
        :satellite-visible="satelliteVisible"
        :bee-mode-enabled="beeModeEnabled"
        :active-project-areas="activeProjectAreas"
        :project-area-fill-visible="projectAreaFillVisible"
        @toggle-theme="toggleTheme"
        @change-language="changeLanguage"
        @toggle-satellite="toggleSatellite"
        @toggle-bee-mode="toggleBeeMode"
        @toggle-project-area="toggleProjectArea"
        @set-all-project-areas="setAllProjectAreas"
        @toggle-project-area-fill="toggleProjectAreaFill"
        @set-dimension="setDimension"
        @show-airport="showAirport"
        @show-stadtheide="showStadtheide"
        @tree-filter-action="updateTreeFilters"
        @height-threshold-change="updateHeightThreshold"
      />
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import Sidebar from './components/Sidebar.vue';
import MapStage from './components/MapStage.vue';
import { createInitialAtlasState } from './atlas-state.js';
import { translate } from './translate.js';
import { uiPreferences } from './ui-preferences.js';

const sidebarCollapsed = ref(uiPreferences.sidebarCollapsed);
const theme = ref(uiPreferences.theme);
const language = ref(uiPreferences.language);
const coordinates = ref('52.554° N · 13.289° E');
const mapError = ref(false);
const satelliteVisible = ref(false);
const beeModeEnabled = ref(false);
const activeProjectAreas = ref(['tegeler-stadtheide']);
const projectAreaFillVisible = ref(false);
const internalViewOpen = ref(false);
const activeInternalLayers = ref(['tree-health', 'tree', 'depression']);
const atlas = reactive(createInitialAtlasState());
let mapApp;

onMounted(async () => {
  const { startMap } = await import('./map-app.js');
  mapApp = startMap({
    atlas,
    onCoordinatesChange(value) { coordinates.value = value; },
    onMapError() { mapError.value = true; },
    onProjectAreasChange(areas, fillVisible) {
      activeProjectAreas.value = areas;
      projectAreaFillVisible.value = fillVisible;
    },
    onInternalViewChange(open, layers) {
      internalViewOpen.value = open;
      activeInternalLayers.value = layers;
    },
    onEventFilterChange: updateEventFilter,
  });
});

function toggleTheme() {
  theme.value = uiPreferences.setTheme(theme.value === 'dark' ? 'light' : 'dark');
}

function toggleSidebar() {
  sidebarCollapsed.value = uiPreferences.setSidebarCollapsed(!sidebarCollapsed.value);
  mapApp?.scheduleSidebarResize();
}

function changeLanguage(value) {
  language.value = mapApp?.localization.applyLanguage(value) ?? uiPreferences.setLanguage(value);
}

function toggleSatellite() {
  satelliteVisible.value = !satelliteVisible.value;
  mapApp?.setSatelliteVisible(satelliteVisible.value);
}

function toggleBeeMode() {
  beeModeEnabled.value = !beeModeEnabled.value;
  document.documentElement.classList.toggle('bee-mode', beeModeEnabled.value);
}

function toggleProjectArea(id) {
  mapApp?.toggleProjectArea(id);
}

function setAllProjectAreas(visible) {
  mapApp?.setAllProjectAreasVisible(visible);
}

function toggleProjectAreaFill() {
  mapApp?.toggleProjectAreaFill();
}

function toggleInternalView() {
  mapApp?.setInternalViewOpen(!internalViewOpen.value);
}

function toggleInternalLayer(layer) {
  mapApp?.toggleInternalLayer(layer);
}

function setAllInternalLayers(visible) {
  mapApp?.setAllInternalLayersVisible(visible);
}

function selectPlace(id) {
  mapApp?.selectPlace(id, true, true);
}

function togglePlaces() {
  mapApp?.setPlacesVisible(!atlas.placesVisible);
}

function setDimension(value) {
  mapApp?.setDimension(value);
}

function showAirport() {
  mapApp?.showAirport();
}

function showStadtheide() {
  mapApp?.selectPlace('tegeler-stadtheide');
}

function refreshEventPopup() {
  mapApp?.refreshEventPopup();
}

function updateEventFilter(action) {
  if (action.type === 'reset') {
    atlas.eventFilters = { status: 'all', format: 'all', targetGroup: 'all' };
  } else {
    atlas.eventFilters[action.key] = action.value;
  }
  refreshEventPopup();
}

function selectEvent(url) {
  mapApp?.selectEvent(url);
}

function closeEvent() {
  mapApp?.closeEvent();
}

function updateTreeFilters(action) {
  const filters = atlas.treeFilters;
  if (action.type === 'conspicuous') filters.conspicuousOnly = action.value;
  if (action.type === 'value') {
    filters[`${action.kind}Values`][filters[`${action.kind}Mode`]] = action.value;
  }
  if (action.type === 'mode') {
    filters[`${action.kind}Mode`] = filters[`${action.kind}Mode`] === 'minimum' ? 'maximum' : 'minimum';
  }
  mapApp?.setTreeFilters();
}

function updateHeightThreshold(value) {
  atlas.heightAnalysis.threshold = value;
  mapApp?.scheduleHeightUpdate();
}
</script>
