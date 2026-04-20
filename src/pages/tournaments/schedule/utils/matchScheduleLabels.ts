import { format } from "date-fns";
import type { Locale } from "date-fns";
import { parseIsoDateSafely } from "@/utils/date";

export function matchScheduleDateTimeLabels(
  startTimeIso: string | null,
  locale: Locale,
  tbd: string
): { date: string; time: string } {
  if (!startTimeIso) {
    return { date: tbd, time: tbd };
  }
  const parsed = parseIsoDateSafely(startTimeIso);
  if (!parsed) {
    return { date: tbd, time: tbd };
  }
  return {
    date: format(parsed, "EEE, MMM d", { locale }),
    time: format(parsed, "HH:mm", { locale }),
  };
}
