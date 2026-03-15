import type { Locale } from "date-fns";
import { de } from "date-fns/locale";
import { enUS } from "date-fns/locale";

const dateFnsLocaleMap: Record<string, Locale> = {
  de,
  en: enUS,
};

/**
 * Returns the date-fns locale for the given i18n language code (e.g. from i18n.language).
 * Used so date formatting (e.g. "d MMM, yyyy") follows the app locale.
 */
export function getDateFnsLocale(lang: string): Locale | undefined {
  const base = lang.split("-")[0];
  return dateFnsLocaleMap[base] ?? dateFnsLocaleMap[lang] ?? undefined;
}
