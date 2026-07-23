/** List-path date formatting without date-fns (keeps date-fns off the tournaments table chunk). */
export function formatListDate(
  value: string | null | undefined,
  fallback: string,
  language?: string,
) {
  if (!value?.trim()) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  try {
    return new Intl.DateTimeFormat(language || undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parsed);
  } catch {
    return fallback;
  }
}
