export function formatTimeTo12Hour(time: string | null | undefined): string | null {
  if (!time) return null;

  const normalized = time.trim();
  if (!normalized) return null;

  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return normalized;

  const hours = Number(match[1]);
  const minutes = match[2];

  if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
    return normalized;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${minutes} ${period}`;
}

export function normalizeTimeTo24Hour(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized) return null;

  if (/^\d{1,2}:\d{2}$/.test(normalized)) {
    const [hoursText, minutes] = normalized.split(":");
    const hours = Number.parseInt(hoursText, 10);
    if (!Number.isInteger(hours) || hours < 0 || hours > 23) return null;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  const match = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return null;

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

/** Minutes since midnight (0–1439) from a time string; uses {@link normalizeTimeTo24Hour}. */
export function time24ToMinutes(value: string | null | undefined): number | null {
  const n = normalizeTimeTo24Hour(value);
  if (!n) return null;
  const [h, m] = n.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

export function minutesToTime24(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, total));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type TimeBoundsMinutes = {
  minMinutes: number | null;
  maxMinutes: number | null;
};

/**
 * Resolves optional min/max time strings into minute bounds.
 * Exclusive flags shrink the allowed interval by one minute on that side.
 */
export function resolveTimeBoundsMinutes(
  minTime?: string | null,
  maxTime?: string | null,
  options?: { minExclusive?: boolean; maxExclusive?: boolean }
): TimeBoundsMinutes {
  let minMinutes = minTime != null ? time24ToMinutes(minTime) : null;
  let maxMinutes = maxTime != null ? time24ToMinutes(maxTime) : null;
  if (options?.minExclusive && minMinutes !== null) minMinutes += 1;
  if (options?.maxExclusive && maxMinutes !== null) maxMinutes -= 1;
  return { minMinutes, maxMinutes };
}

export function isMinutesWithinTimeBounds(m: number, bounds: TimeBoundsMinutes): boolean {
  if (bounds.minMinutes !== null && m < bounds.minMinutes) return false;
  if (bounds.maxMinutes !== null && m > bounds.maxMinutes) return false;
  return true;
}

export function hasNonEmptyTimeBounds(bounds: TimeBoundsMinutes): boolean {
  if (bounds.minMinutes === null || bounds.maxMinutes === null) return true;
  return bounds.minMinutes <= bounds.maxMinutes;
}
