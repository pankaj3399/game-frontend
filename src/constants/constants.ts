const CONTACT_US_EMAIL = "service.tb10@gmail.com";
const COMPANY_NAME = "TB10";
const IBAN = "DE00 0000 0000 0000 0000 00";
const TB10_SHARE_URL = "https://wwwdev.tiebreak10.eu/";
/** Public Notion page for User terms. Set via VITE_USER_TERMS_URL when published. */
const USER_TERMS_URL = (import.meta.env.VITE_USER_TERMS_URL as string | undefined)?.trim() ?? "";

/**
 * YouTube tutorial videos shown on About.
 * Add entries when videos are ready, e.g. { titleKey: "about.tutorialVideoIntro", url: "https://youtube.com/..." }.
 */
export const TUTORIAL_VIDEOS: ReadonlyArray<{ titleKey: string; url: string }> = [];

// Global parameters
export const GLOBAL_PARAMETERS = {
  CONTACT_US_EMAIL,
  CONTACT_US_MAILTO: `mailto:${CONTACT_US_EMAIL}`,
  COMPANY_NAME,
  IBAN,
  TB10_SHARE_URL,
  TB10_URL: "https://www.tiebreak10.eu",
  USER_TERMS_URL,
  GLICKMAN_URL: "https://datascience.harvard.edu/directory/mark-glickman/",
  GLICKO_WIKI_URL: "https://de.wikipedia.org/wiki/Glicko-System#Schritt_1",
  ELO_WIKI_URL: "https://en.wikipedia.org/wiki/Arpad_Elo",
} as const;
