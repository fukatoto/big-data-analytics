import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { translate } from './translate.js';

function translatedValue([key, language]) {
  const variables = key === 'footer' ? { year: new Date().getFullYear() } : {};
  return translate(language, key, variables);
}

const textTranslation = {
  mounted(element, binding) {
    element.textContent = translatedValue(binding.value);
  },
  updated(element, binding) {
    if (binding.value[1] !== binding.oldValue?.[1]) {
      element.textContent = translatedValue(binding.value);
    }
  },
};

const ariaTranslation = {
  mounted(element, binding) {
    element.setAttribute('aria-label', translatedValue(binding.value));
  },
  updated(element, binding) {
    if (binding.value[1] !== binding.oldValue?.[1]) {
      element.setAttribute('aria-label', translatedValue(binding.value));
    }
  },
};

createApp(App)
  .directive('i18n', textTranslation)
  .directive('i18n-aria', ariaTranslation)
  .mount('#app');
