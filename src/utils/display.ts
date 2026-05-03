import { formatDateOrFallback } from "@/utils/date";
import { formatTimeTo24Hour } from "@/utils/time";
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
  const formattedStart = formatTimeTo24Hour(startTime);
  const formattedEnd = formatTimeTo24Hour(endTime);

  if (!formattedStart && !formattedEnd) return fallback;
  if (formattedStart && formattedEnd) {
    return formatRange ? formatRange(formattedStart, formattedEnd) : `${formattedStart} - ${formattedEnd}`;
  }

  return formattedStart ?? formattedEnd ?? fallback;
}

function getTimeZoneReferenceDate(date: string | null | undefined): Date {
  const datePart = date?.trim().slice(0, 10);
  if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const parsed = new Date(`${datePart}T12:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

function acronymFromTimeZoneName(timeZoneName: string): string | null {
  const normalized = timeZoneName.trim();
  if (!normalized) return null;

  if (/^(?:GMT|UTC)(?:$|[+-])/.test(normalized)) return normalized;
  if (normalized === "Coordinated Universal Time") return "UTC";

  const words = normalized.match(/[A-Za-z]+/g);
  if (!words || words.length < 2) return null;

  const initials = words
    .filter((word) => !["of", "the"].includes(word.toLowerCase()))
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return /^[A-Z]{2,5}$/.test(initials) ? initials : null;
}

export function formatTimeZoneAbbreviation(
  timeZone: string | null | undefined,
  date?: string | null
): string | null {
  const normalizedTimeZone = timeZone?.trim();
  if (!normalizedTimeZone) return null;

  try {
    const referenceDate = getTimeZoneReferenceDate(date);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: normalizedTimeZone,
      timeZoneName: "long",
      hour: "2-digit",
    });
    const timeZoneName = formatter
      .formatToParts(referenceDate)
      .find((part) => part.type === "timeZoneName")?.value;

    if (!timeZoneName) return null;

    return acronymFromTimeZoneName(timeZoneName);
  } catch {
    return null;
  }
}
