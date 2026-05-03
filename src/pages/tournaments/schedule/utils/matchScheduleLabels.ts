import type { Locale } from "date-fns";
import { parseIsoDateSafely } from "@/utils/date";
import { formatTimeZoneAbbreviation } from "@/utils/display";

export function matchScheduleDateTimeLabels(
  startTimeIso: string | null,
  locale: Locale,
  tbd: string,
  timeZone?: string | null
): { date: string; time: string; timeZone: string | null } {
  const parsed = parseIsoDateSafely(startTimeIso);
  if (!startTimeIso || !parsed) {
    return { date: tbd, time: tbd, timeZone: null };
  }
  const localeTag = locale.code ?? "en-US";
  const normalizedTimeZone = timeZone?.trim() || undefined;
  const dateTimeOptions = normalizedTimeZone ? { timeZone: normalizedTimeZone } : {};

  return {
    date: new Intl.DateTimeFormat(localeTag, {
      ...dateTimeOptions,
      dateStyle: "short",
    }).format(parsed),
    time: new Intl.DateTimeFormat(localeTag, {
      ...dateTimeOptions,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(parsed),
    timeZone: formatTimeZoneAbbreviation(timeZone, startTimeIso),
  };
}
