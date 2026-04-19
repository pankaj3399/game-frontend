import type { TFunction } from "i18next";

export interface TournamentDetailsTabOption {
  value: string;
  label: string;
}

export function getTournamentDetailsTabOptions(t: TFunction): TournamentDetailsTabOption[] {
  return [
    { value: "info", label: t("tournaments.info") },
    { value: "matches", label: t("tournaments.matches") },
    { value: "results", label: t("tournaments.results") },
    { value: "sponsors", label: t("tournaments.sponsorsTab") },
  ];
}

/** Resolve `?tab=` from the URL to a valid details tab (sync — no effects). */
export function resolveTournamentDetailsTab(requestedTab: string | null, t: TFunction): string {
  const tabValues = getTournamentDetailsTabOptions(t).map((tab) => tab.value);
  return requestedTab && tabValues.includes(requestedTab) ? requestedTab : "info";
}
