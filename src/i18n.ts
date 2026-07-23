import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { APP_LANGUAGES, type AppLanguageCode } from './lib/appLanguages'
import en from './locales/en.json'

const supportedLngs = APP_LANGUAGES.map((language) => language.code)

type LocaleMessages = typeof en

const localeLoaders: Record<
  Exclude<AppLanguageCode, 'en'>,
  () => Promise<{ default: LocaleMessages }>
> = {
  de: () => import('./locales/de.json'),
  es: () => import('./locales/es.json'),
  fr: () => import('./locales/fr.json'),
  it: () => import('./locales/it.json'),
  sv: () => import('./locales/sv.json'),
}

const loadingLocales = new Map<string, Promise<void>>()

function toLanguageCode(lng: string | undefined): AppLanguageCode {
  const base = lng?.split('-')[0]?.toLowerCase() ?? 'en'
  return (supportedLngs as readonly string[]).includes(base)
    ? (base as AppLanguageCode)
    : 'en'
}

/** Ensure a locale bundle is registered before switching language. English is always bundled. */
export async function ensureLocaleLoaded(lng: string | undefined): Promise<AppLanguageCode> {
  const code = toLanguageCode(lng)
  if (code === 'en' || i18n.hasResourceBundle(code, 'translation')) {
    return code
  }

  const inFlight = loadingLocales.get(code)
  if (inFlight) {
    await inFlight
    return code
  }

  const loader = localeLoaders[code]
  const promise = loader()
    .then((mod) => {
      i18n.addResourceBundle(code, 'translation', mod.default, true, true)
    })
    .finally(() => {
      loadingLocales.delete(code)
    })

  loadingLocales.set(code, promise)
  await promise
  return code
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    fallbackLng: 'en',
    supportedLngs: [...supportedLngs],
    // Detected languages may not be in `resources` until lazy-loaded.
    partialBundledLanguages: true,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .then(async () => {
    const detected = toLanguageCode(i18n.resolvedLanguage ?? i18n.language)
    if (detected === 'en') return
    try {
      await ensureLocaleLoaded(detected)
      if (i18n.language !== detected) {
        await i18n.changeLanguage(detected)
      }
    } catch {
      // Keep English fallback if a locale chunk fails to load.
    }
  })

i18n.on('languageChanged', (lng) => {
  void ensureLocaleLoaded(lng).catch(() => {
    /* ignore — UI stays on previously loaded / English bundle */
  })
})

export default i18n
