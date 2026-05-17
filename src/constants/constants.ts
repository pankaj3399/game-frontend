const CONTACT_US_EMAIL = "service.tb10@gmail.com";
const COMPANY_NAME = "TB10";
const IBAN = "DE00 0000 0000 0000 0000 00";
const TB10_SHARE_URL = "https://wwwdev.tiebreak10.eu/";

// Global parameters
export const GLOBAL_PARAMETERS = {
  CONTACT_US_EMAIL,
  CONTACT_US_MAILTO: `mailto:${CONTACT_US_EMAIL}`,
  COMPANY_NAME,
  IBAN,
  TB10_SHARE_URL,
  TB10_URL: "https://www.tiebreak10.eu",
  GLICKMAN_URL: "https://datascience.harvard.edu/directory/mark-glickman/",
  GLICKO_WIKI_URL: "https://de.wikipedia.org/wiki/Glicko-System#Schritt_1",
  ELO_WIKI_URL: "https://en.wikipedia.org/wiki/Arpad_Elo",
} as const;
