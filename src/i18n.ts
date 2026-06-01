import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { APP_LANGUAGES } from './lib/appLanguages'
import en from './locales/en.json'
import de from './locales/de.json'
import es from './locales/es.json'
import it from './locales/it.json'
import sv from './locales/sv.json'

const supportedLngs = APP_LANGUAGES.map((language) => language.code)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    es: { translation: es },
    it: { translation: it },
    sv: { translation: sv },
  },
  fallbackLng: 'en',
  supportedLngs: [...supportedLngs],
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
