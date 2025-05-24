// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import { translations } from '../locales';

// Define your fallback language
const fallbackLng = 'en';

// Get the device's current locale (e.g., "fr-CA" → "fr")
const deviceLanguage = Localization.locale.split('-')[0];

i18n
  .use(initReactI18next)
  .init({
    lng: deviceLanguage,
    fallbackLng,
    resources: {
      en: { translation: translations.en },
    },
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n;
