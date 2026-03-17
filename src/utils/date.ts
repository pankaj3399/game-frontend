import { format, isValid, parseISO } from "date-fns";
import type { Locale } from "date-fns";

export function parseIsoDateSafely(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function formatDateForApi(value: Date | null | undefined): string {
  if (!value) return "";
  return format(value, "yyyy-MM-dd");
}

export function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeIsoDateInputValue(value: string | null): string | null {
  if (!value) return null;
  const dateOnly = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  try {
    return isValid(parseISO(dateOnly)) ? dateOnly : null;
  } catch {
    return null;
  }
}

export function normalizeDateToUtcIsoString(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    if (!isValid(parsed)) return null;
    return new Date(
      Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
    ).toISOString();
  } catch {
    return null;
  }
}

export function formatDateOrFallback(
  value: string | null,
  fallback: string,
  pattern = "d MMM, yyyy",
  locale?: Locale
) {
  if (!value) return fallback;
  try {
    const parsed = parseISO(value);
    return isValid(parsed) ? format(parsed, pattern, { locale }) : fallback;
  } catch {
    return fallback;
  }
}
