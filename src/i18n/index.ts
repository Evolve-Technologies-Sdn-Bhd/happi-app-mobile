/**
 * i18n Configuration
 * Internationalization setup with i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import ms from './ms';

const resources = {
  en: { translation: en },
  ms: { translation: ms },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
    
    // React Native specific settings
    compatibilityJSON: 'v4',
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;
