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
