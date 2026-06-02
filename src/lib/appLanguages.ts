export const APP_LANGUAGES = [
  { code: "en", nativeName: "English", shortLabel: "EN" },
  { code: "de", nativeName: "Deutsch", shortLabel: "DE" },
  { code: "es", nativeName: "Español", shortLabel: "ES" },
  { code: "fr", nativeName: "Français", shortLabel: "FR" },
  { code: "it", nativeName: "Italiano", shortLabel: "IT" },
  { code: "sv", nativeName: "Svenska", shortLabel: "SV" },
] as const;

export type AppLanguageCode = (typeof APP_LANGUAGES)[number]["code"];

const supportedCodes = new Set<string>(APP_LANGUAGES.map((l) => l.code));

/** Languages that tend to need tighter nav typography (longer labels). */
const compactNavCodes = new Set<AppLanguageCode>(["de", "es", "fr", "it"]);

export function resolveAppLanguage(
  resolvedLanguage: string | undefined,
): AppLanguageCode {
  const base = resolvedLanguage?.split("-")[0]?.toLowerCase() ?? "en";
  if (supportedCodes.has(base)) return base as AppLanguageCode;
  return "en";
}

export function getAppLanguageMeta(code: AppLanguageCode) {
  return APP_LANGUAGES.find((l) => l.code === code) ?? APP_LANGUAGES[0];
}

export function usesCompactNavTypography(code: AppLanguageCode): boolean {
  return compactNavCodes.has(code);
}
