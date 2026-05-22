/** sessionStorage key for post-login redirect (survives OAuth full-page navigation). */
export const RETURN_AFTER_LOGIN_KEY = "returnAfterLogin";

/** App-relative path only (single leading slash, no protocol-relative open redirect). */
export function isAppRelativeReturnPath(path: string): boolean {
  const trimmed = path.trim();
  return trimmed.startsWith("/") && !trimmed.startsWith("//");
}

export function saveReturnPath(path: string): void {
  if (typeof window === "undefined") return;
  const trimmed = path.trim();
  if (!isAppRelativeReturnPath(trimmed)) return;
  try {
    sessionStorage.setItem(RETURN_AFTER_LOGIN_KEY, trimmed);
  } catch {
    /* private mode */
  }
}

export function consumeReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(RETURN_AFTER_LOGIN_KEY)?.trim() ?? "";
    sessionStorage.removeItem(RETURN_AFTER_LOGIN_KEY);
    if (!isAppRelativeReturnPath(value)) return null;
    return value;
  } catch {
    return null;
  }
}

export function loginPathWithReturn(returnPath?: string): string {
  const trimmed = returnPath?.trim() ?? "";
  if (!isAppRelativeReturnPath(trimmed)) return "/login";
  return `/login?returnTo=${encodeURIComponent(trimmed)}`;
}
