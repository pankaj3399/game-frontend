import type { Locale } from "date-fns";
import { parseIsoDateSafely } from "@/utils/date";

export function matchScheduleDateTimeLabels(
  startTimeIso: string | null,
  locale: Locale,
  tbd: string
): { date: string; time: string } {
  const parsed = parseIsoDateSafely(startTimeIso);
  if (!startTimeIso || !parsed) {
    return { date: tbd, time: tbd };
  }
  const localeTag = locale.code ?? "en-US";
  return {
    date: new Intl.DateTimeFormat(localeTag, {
      dateStyle: "short",
    }).format(parsed),
    time: new Intl.DateTimeFormat(localeTag, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(parsed),
  };
}
