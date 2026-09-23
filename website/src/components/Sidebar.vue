<template>
      <aside
        id="sidebar"
        class="sidebar relative flex min-h-0 flex-col overflow-hidden"
        :class="{ 'has-event-detail': atlas.selected === 'zelt', 'is-showing-event': Boolean(atlas.selectedEventUrl) && atlas.selected === 'zelt' }"
        aria-label="Map information and places"
      >
        <div class="sidebar-top shrink-0">
          <div class="brand-lockup flex items-center gap-3.75">
            <span class="brand-mark" aria-hidden="true"
              >TXL<span class="brand-mark-dot">.</span></span
            >
            <span class="brand-caption">BERLIN<br />URBAN TECH REPUBLIC</span>
          </div>
          <div class="edition-label">
            <span class="edition-line"></span>
            <span v-i18n="['interactiveAtlas', language]">INTERACTIVE ATLAS</span>
          </div>
          <h1>
            <span v-i18n="['explore', language]">Explore</span><br /><em>Berlin TXL</em>
          </h1>
          <p class="intro" v-i18n="['intro', language]">
            The former Flughafen Berlin Tegel, seen from a new angle. Explore
            its landmark terminals in 3D.
          </p>
          <div class="fact-row flex items-center gap-4.5">
            <div>
              <strong>190 <small>ha</small></strong
              ><span v-i18n="['stadtheide', language]">Tegeler Stadtheide</span>
            </div>
            <span class="fact-divider" aria-hidden="true"></span>
            <div>
              <strong>500 <small>ha</small></strong
              ><span v-i18n="['formerAirport', language]">Former Airport</span>
            </div>
          </div>
        </div>

        <div class="places-section flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div class="section-heading">
            <span v-i18n="['placesAndAreas', language]">PLACES &amp; PROJECT AREAS</span>
          </div>
          <PlacesList
            :selected="atlas.selected"
            :places-visible="atlas.placesVisible"
            :language="language"
            @select-place="(id) => emit('select-place', id)"
            @toggle-places="emit('toggle-places')"
          />
          <div class="internal-view-section">
            <button
              id="internal-view-toggle"
              class="terminal-places-toggle"
              :class="{ 'is-active': internalViewOpen }"
              type="button"
              role="switch"
              :aria-checked="String(internalViewOpen)"
              aria-controls="internal-view-options"
              @click="emit('toggle-internal-view')"
            >
              <span class="terminal-places-label"
                ><svg class="internal-view-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 7.5 12 3l9 4.5-9 4.5L3 7.5Z" />
                  <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
                </svg><span v-i18n="['internalView', language]">INTERNAL VIEW</span></span
              ><i aria-hidden="true"><b></b></i>
            </button>
            <div id="internal-view-options" v-show="internalViewOpen" class="internal-view-options">
              <button type="button" class="internal-view-option" :class="{ 'is-active': activeInternalLayers.includes('tree') }" data-internal-layer="tree" :aria-pressed="String(activeInternalLayers.includes('tree'))" @click="emit('toggle-internal-layer', 'tree')">
                <span class="internal-view-option-label"><svg class="internal-view-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m12 3 5.5 7H15l4.5 6H4.5L9 10H6.5L12 3Z" /><path d="M12 16v5" />
                </svg><span v-i18n="['trees', language]">Trees</span></span><b aria-hidden="true">✓</b>
              </button>
              <button type="button" class="internal-view-option" :class="{ 'is-active': activeInternalLayers.includes('depression') }" data-internal-layer="depression" :aria-pressed="String(activeInternalLayers.includes('depression'))" @click="emit('toggle-internal-layer', 'depression')">
                <span class="internal-view-option-label"><svg class="internal-view-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 8c3 0 4 9 10 9s7-9 10-9" /><path d="M5 6c2 0 3 7 7 7s5-7 7-7" />
                </svg><span v-i18n="['depressions', language]">Depressions</span></span><b aria-hidden="true">✓</b>
              </button>
              <button type="button" class="internal-view-option" :class="{ 'is-active': activeInternalLayers.includes('tree-health') }" data-internal-layer="tree-health" :aria-pressed="String(activeInternalLayers.includes('tree-health'))" @click="emit('toggle-internal-layer', 'tree-health')">
                <span class="internal-view-option-label"><svg class="internal-view-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20c-5-3-8-6.2-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 3.8-3 7-8 10Z" /><path d="M6.5 13h3l1.5-2.5 2 5 1.5-2.5h3" />
                </svg><span v-i18n="['forestHealth', language]">Forest health</span></span><b aria-hidden="true">✓</b>
              </button>
              <div class="internal-view-bulk-actions">
                <button id="show-all-internal-layers" type="button" @click="emit('set-all-internal-layers', true)"><svg class="bulk-action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" />
                </svg><span v-i18n="['showAllAreas', language]">Show all</span></button>
                <button id="hide-all-internal-layers" type="button" @click="emit('set-all-internal-layers', false)"><svg class="bulk-action-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3 21 21M10.6 6.1A12 12 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.5M6.2 6.9C3.5 8.7 2 12 2 12s3.5 6 10 6a11 11 0 0 0 3.2-.5" /><path d="M10 10a2.5 2.5 0 0 0 4 4" />
                </svg><span v-i18n="['hideAllAreas', language]">Hide all</span></button>
              </div>
            </div>
          </div>
          <PlaceDetail :atlas="atlas" :language="language" @filter-change="(action) => emit('filter-change', action)" @select-event="(url) => emit('select-event', url)" @close-event="emit('close-event')" />
        </div>

        <div class="sidebar-bottom">
          <span v-i18n="['footer', language]"
            >Existing map data · future uses are planned</span
          >
        </div>
      </aside>
</template>
<script setup>
import PlaceDetail from './PlaceDetail.vue';
import PlacesList from './PlacesList.vue';

defineProps({
  atlas: { type: Object, required: true },
  language: { type: String, required: true },
  internalViewOpen: { type: Boolean, required: true },
  activeInternalLayers: { type: Array, required: true },
});
const emit = defineEmits([
  'toggle-internal-view', 'toggle-internal-layer', 'set-all-internal-layers',
  'select-place', 'toggle-places', 'filter-change', 'select-event', 'close-event',
]);
</script>
