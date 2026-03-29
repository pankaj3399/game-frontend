/**
 * Validates a URL from backend/user input for safe use in links (e.g. anchor href).
 * Returns the trimmed URL if valid, or null if missing/invalid.
 *
 * - Rejects null, undefined, empty strings
 * - Rejects invalid URLs (malformed, parse errors)
 * - Rejects non-http(s) protocols (e.g. javascript:, data:) for security
 */
export function getSafeLink(
  value: string | null
): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : trimmed.startsWith("//")
      ? `https:${trimmed}`
      : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
