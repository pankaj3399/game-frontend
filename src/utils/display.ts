import { formatDateOrFallback } from "@/utils/date";
import { formatTimeTo12Hour } from "@/utils/time";
import type { Locale } from "date-fns";

type TimeRangeFormatter = (start: string, end: string) => string;

export function formatDateDisplay(
  value: string | null,
  fallback: string,
  locale?: Locale,
  pattern = "d MMM, yyyy"
) {
  return formatDateOrFallback(value, fallback, pattern, locale);
}

export function formatTimeRangeDisplay(
  startTime: string | null,
  endTime: string | null,
  fallback: string,
  formatRange?: TimeRangeFormatter
) {
  const formattedStart = formatTimeTo12Hour(startTime);
  const formattedEnd = formatTimeTo12Hour(endTime);

  if (!formattedStart && !formattedEnd) return fallback;
  if (formattedStart && formattedEnd) {
    return formatRange ? formatRange(formattedStart, formattedEnd) : `${formattedStart} - ${formattedEnd}`;
  }

  return formattedStart ?? formattedEnd ?? fallback;
}
