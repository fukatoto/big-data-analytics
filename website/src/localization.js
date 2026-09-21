import { translations } from './i18n.js';

export function createLocalization(defaultLanguage = 'de') {
  const listeners = new Set();
  let language = readSavedLanguage() ?? defaultLanguage;
  if (!translations[language]) language = defaultLanguage;

  function readSavedLanguage() {
    try {
      const savedLanguage = localStorage.getItem('txl-language');
      return translations[savedLanguage] ? savedLanguage : null;
    } catch {
      return null;
    }
  }

  function saveLanguage() {
    try {
      localStorage.setItem('txl-language', language);
    } catch {
      // The selection still works when browser storage is unavailable.
    }
  }

  function t(key, variables = {}) {
    const template = translations[language]?.[key] ?? translations.en[key] ?? key;
    return Object.entries(variables).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template
    );
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
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    document.querySelector('meta[name="description"]').content = t('metaDescription');
    document.getElementById('language-select').value = language;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      element.setAttribute('aria-label', t(element.dataset.i18nAria));
    });
    updateNavigationControlLabels();
  }

  function applyLanguage(nextLanguage = language) {
    language = translations[nextLanguage] ? nextLanguage : 'en';
    saveLanguage();
    translateDocument();
    listeners.forEach((listener) => listener());
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
      return language;
    }
  };
}
