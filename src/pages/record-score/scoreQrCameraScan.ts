/** Normalize raw QR payload (URL with ?token= or raw token string). */
export function parseScoreQrTokenFromPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    try {
      const asUrl = new URL(trimmed);
      const tokenFromQuery = asUrl.searchParams.get("token")?.trim();
      if (tokenFromQuery) return tokenFromQuery;

      const hashPayload = asUrl.hash.replace(/^#\??/, "");
      return new URLSearchParams(hashPayload).get("token")?.trim() ?? "";
    } catch {
      return "";
    }
  }

  return trimmed;
}
