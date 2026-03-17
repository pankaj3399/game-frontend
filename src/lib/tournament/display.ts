import type { Locale } from "date-fns";
import { formatDateDisplay, formatTimeRangeDisplay } from "@/utils/display";

type TranslateTimeRange = (key: string, opts?: { start?: string; end?: string }) => string;

export function formatTournamentDate(value: string | null, fallback: string, locale?: Locale) {
  return formatDateDisplay(value, fallback, locale);
}

export function formatTournamentTimeRange(
  startTime: string | null,
  endTime: string | null,
  fallback: string,
  t: TranslateTimeRange
) {
  return formatTimeRangeDisplay(startTime, endTime, fallback, (start, end) =>
    t("tournaments.timeRange", { start, end })
  );
}
