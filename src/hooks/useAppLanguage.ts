import { useTranslation } from "react-i18next";
import {
  getAppLanguageMeta,
  resolveAppLanguage,
  type AppLanguageCode,
} from "@/lib/appLanguages";
import { ensureLocaleLoaded } from "@/i18n";

export function useAppLanguage() {
  const { i18n } = useTranslation();
  const currentCode = resolveAppLanguage(i18n.resolvedLanguage);
  const current = getAppLanguageMeta(currentCode);

  const changeLanguage = (code: AppLanguageCode) => {
    if (code === currentCode) return;
    void ensureLocaleLoaded(code)
      .then(() => i18n.changeLanguage(code))
      .catch(() => {
        /* keep previous language if the locale chunk fails to load */
      });
  };

  return { currentCode, current, changeLanguage };
}
