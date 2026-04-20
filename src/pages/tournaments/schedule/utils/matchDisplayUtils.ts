/** Two-letter initials from a display name (first + last token). */
export function initialsFromName(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "?";
  }

  const first = tokens[0][0] ?? "";
  const second = tokens.length > 1 ? tokens[tokens.length - 1][0] ?? "" : "";
  return `${first}${second}`.toUpperCase();
}
