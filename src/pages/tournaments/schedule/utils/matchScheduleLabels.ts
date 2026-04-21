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
    date: format(parsed, "P", { locale }),
    time: format(parsed, "p", { locale }),
  };
}
