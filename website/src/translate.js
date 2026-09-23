import { translations } from './i18n.js';

export function translate(language, key, variables = {}) {
  const template = translations[language]?.[key] ?? translations.en[key] ?? key;
  return Object.entries(variables).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
