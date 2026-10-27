import { createI18n } from 'vue-i18n';

import es from './locales/es.json';

export const DEFAULT_LOCALE = 'es';

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { es },
});
