<template>
  <section
    class="height-control tree-health-control mobile-map-panel is-desktop-collapsed"
    aria-labelledby="tree-health-control-title"
    hidden
  >
    <button class="mobile-panel-toggle" type="button" aria-expanded="false" aria-controls="tree-health-panel-body">
      <span class="mobile-panel-toggle-icon is-height" aria-hidden="true"></span>
      <span v-i18n="['forestHealth', language]">Forest health</span>
      <span class="mobile-panel-chevron" aria-hidden="true"></span>
    </button>
    <div class="mobile-panel-body" id="tree-health-panel-body">
      <div class="height-control-heading">
        <div>
          <span class="height-control-kicker" v-i18n="['forestAnalysis', language]">TREE ANALYSIS</span>
          <h2 id="tree-health-control-title" v-i18n="['forestHealth', language]">Forest health</h2>
          <p id="tree-visible-count" class="tree-visible-count" aria-live="polite">{{ visibleCountLabel }}</p>
        </div>
        <div class="height-control-heading-actions">
          <output id="tree-height-value" for="tree-height-threshold">{{ heightValueLabel }}</output>
          <output id="tree-crown-value" for="tree-crown-threshold">{{ crownValueLabel }}</output>
          <output id="tree-green-value" for="tree-green-threshold">{{ greenValueLabel }}</output>
          <div class="tree-health-panel-buttons">
            <button class="desktop-panel-collapse" type="button" aria-expanded="false" aria-controls="tree-health-desktop-content" v-i18n-aria="['togglePanel', language]"></button>
            <label class="tree-conspicuous-control" for="tree-conspicuous-only" :title="translate('onlyConspicuousTrees')">
              <input id="tree-conspicuous-only" type="checkbox" :checked="filters.conspicuousOnly" @change="setConspicuousOnly" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3 22 20H2L12 3Z" />
                <path d="M12 9v5m0 3h.01" />
              </svg>
              <span class="sr-only" v-i18n="['onlyConspicuousTrees', language]">Only trees with conspicuous crowns</span>
            </label>
          </div>
        </div>
      </div>
      <div id="tree-health-desktop-content" class="desktop-collapsible-content">
        <div class="tree-height-control">
          <div class="tree-filter-heading">
            <label for="tree-height-threshold">{{ translate(filters.heightMode === 'minimum' ? 'minimumTreeHeight' : 'maximumTreeHeight') }}</label>
            <button id="tree-height-mode-toggle" class="tree-mode-toggle" type="button" :aria-label="heightModeAction" :title="heightModeAction" :disabled="filters.minimumHeight === null || filters.minimumHeight === filters.maximumHeight" @click="toggleMode('height')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4" />
              </svg>
            </button>
          </div>
          <input id="tree-height-threshold" type="range" :min="filters.minimumHeight ?? 0" :max="filters.maximumHeight ?? 1" step="0.1" :value="filters.heightValues[filters.heightMode] ?? 0" :disabled="filters.minimumHeight === null || filters.minimumHeight === filters.maximumHeight" @input="setValue('height', $event)" />
          <div class="tree-green-range" aria-hidden="true">
            <span id="tree-height-min">{{ filters.minimumHeight === null ? '– m' : `${formatDecimal(filters.minimumHeight, 1)} m` }}</span>
            <span id="tree-height-max">{{ filters.maximumHeight === null ? '– m' : `${formatDecimal(filters.maximumHeight, 1)} m` }}</span>
          </div>
        </div>
        <div class="tree-crown-control">
          <div class="tree-filter-heading">
            <label for="tree-crown-threshold">{{ translate(filters.crownMode === 'minimum' ? 'minimumCrownDiameter' : 'maximumCrownDiameter') }}</label>
            <button id="tree-crown-mode-toggle" class="tree-mode-toggle" type="button" :aria-label="crownModeAction" :title="crownModeAction" :disabled="filters.minimumCrownDiameter === null || filters.minimumCrownDiameter === filters.maximumCrownDiameter" @click="toggleMode('crown')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4" />
              </svg>
            </button>
          </div>
          <input id="tree-crown-threshold" type="range" :min="filters.minimumCrownDiameter ?? 0" :max="filters.maximumCrownDiameter ?? 1" step="0.1" :value="filters.crownValues[filters.crownMode] ?? 0" :disabled="filters.minimumCrownDiameter === null || filters.minimumCrownDiameter === filters.maximumCrownDiameter" @input="setValue('crown', $event)" />
          <div class="tree-green-range" aria-hidden="true">
            <span id="tree-crown-min">{{ filters.minimumCrownDiameter === null ? '– m' : `${formatDecimal(filters.minimumCrownDiameter, 1)} m` }}</span>
            <span id="tree-crown-max">{{ filters.maximumCrownDiameter === null ? '– m' : `${formatDecimal(filters.maximumCrownDiameter, 1)} m` }}</span>
          </div>
        </div>
        <div class="tree-green-control">
          <div class="tree-filter-heading">
            <label for="tree-green-threshold">{{ translate(filters.greenMode === 'minimum' ? 'minimumGreenShare' : 'maximumGreenShare') }}</label>
            <button id="tree-green-mode-toggle" class="tree-mode-toggle" type="button" :aria-label="greenModeAction" :title="greenModeAction" @click="toggleMode('green')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 8h16m-4-4 4 4-4 4M20 16H4m4-4-4 4 4 4" />
              </svg>
            </button>
          </div>
          <input id="tree-green-threshold" type="range" min="0" max="100" step="1" :value="filters.greenValues[filters.greenMode]" @input="setValue('green', $event)" />
          <div class="tree-green-range" aria-hidden="true"><span>0 %</span><span>100 %</span></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { formatDecimal } from '../number-format.js';
import { translate as translateText } from '../translate.js';

const props = defineProps({ filters: { type: Object, required: true }, language: { type: String, required: true } });
const emit = defineEmits(['change']);
const translate = (key, variables) => translateText(props.language, key, variables);
const modeAction = (mode, minimum, maximum) => translate(props.filters[`${mode}Mode`] === 'minimum' ? maximum : minimum);
const heightModeAction = computed(() => modeAction('height', 'minimumTreeHeight', 'maximumTreeHeight'));
const crownModeAction = computed(() => modeAction('crown', 'minimumCrownDiameter', 'maximumCrownDiameter'));
const greenModeAction = computed(() => modeAction('green', 'minimumGreenShare', 'maximumGreenShare'));
const heightValueLabel = computed(() => props.filters.minimumHeight === null ? '– m' : `${props.filters.heightMode === 'maximum' ? '≤' : '≥'} ${formatDecimal(props.filters.heightValues[props.filters.heightMode], 1)} m`);
const crownValueLabel = computed(() => props.filters.minimumCrownDiameter === null ? 'Ø – m' : `Ø ${props.filters.crownMode === 'maximum' ? '≤' : '≥'} ${formatDecimal(props.filters.crownValues[props.filters.crownMode], 1)} m`);
const greenValueLabel = computed(() => `${props.filters.greenMode === 'maximum' ? '≤' : '≥'} ${props.filters.greenValues[props.filters.greenMode]} %`);
const visibleCountLabel = computed(() => {
  if (props.filters.totalCount === null) return '–';
  const numberFormat = new Intl.NumberFormat(props.language);
  return translate(props.filters.conspicuousOnly ? 'treeVisibleCountConspicuous' : 'treeVisibleCount', {
    count: numberFormat.format(props.filters.visibleCount),
    total: numberFormat.format(props.filters.totalCount),
  });
});

function setConspicuousOnly(event) {
  emit('change', { type: 'conspicuous', value: event.target.checked });
}
function setValue(kind, event) {
  emit('change', { type: 'value', kind, value: Number(event.target.value) });
}
function toggleMode(kind) {
  emit('change', { type: 'mode', kind });
}
</script>
