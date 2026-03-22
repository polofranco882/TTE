import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Fallback skeleton strictly to prevent crash on boot before the API DB Request finishes
const resources = {
  en: {
    translation: {
      "common.loading": "Loading application...",
    }
  },
  es: {
    translation: {
      "common.loading": "Cargando aplicación...",
    }
  },
  pt: {
    translation: {
      "common.loading": "Carregando aplicação...",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'pt'],
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export const loadTranslationsFromDB = async () => {
  try {
    const res = await fetch('/api/i18n/locales');
    if (res.ok) {
      const data = await res.json();
      
      // Inject database translations dynamically
      Object.keys(data).forEach((lng) => {
        i18n.addResourceBundle(lng, 'translation', data[lng].translation, true, true);
      });
      console.log('i18n: Remote DB dictionaries injected successfully.');
    }
  } catch (error) {
    console.error('i18n: Failed to fetch remote dictionaries', error);
  }
};

export default i18n;
