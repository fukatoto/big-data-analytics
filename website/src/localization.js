import { translate } from './translate.js';
import { uiPreferences } from './ui-preferences.js';

export function createLocalization() {
  const listeners = new Set();

  function t(key, variables = {}) {
    return translate(uiPreferences.language, key, variables);
  }

  function createTranslatedError(key, variables = {}) {
    const error = new Error(t(key, variables));
    error.translationKey = key;
    error.translationVariables = variables;
    return error;
  }

  function updateNavigationControlLabels() {
    const controls = [
      ['.maplibregl-ctrl-zoom-in', 'zoomIn'],
      ['.maplibregl-ctrl-zoom-out', 'zoomOut'],
      ['.maplibregl-ctrl-compass', 'resetBearing']
    ];
    controls.forEach(([selector, key]) => {
      const control = document.querySelector(selector);
      if (!control) return;
      control.setAttribute('aria-label', t(key));
      control.setAttribute('title', t(key));
    });
  }

  function translateDocument() {
    document.documentElement.lang = uiPreferences.language;
    document.title = t('pageTitle');
    document.querySelector('meta[name="description"]').content = t('metaDescription');
    updateNavigationControlLabels();
  }

  function applyLanguage(nextLanguage = uiPreferences.language) {
    const language = uiPreferences.setLanguage(nextLanguage);
    translateDocument();
    listeners.forEach((listener) => listener());
    return language;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    t,
    applyLanguage,
    createTranslatedError,
    subscribe,
    get language() {
      return uiPreferences.language;
    }
  };
}
