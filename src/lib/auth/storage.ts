/** sessionStorage key for the signed pending signup token (from OAuth callback). */
export const PENDING_SIGNUP_TOKEN_KEY = "pendingSignupToken";

/**
 * localStorage key for the session JWT.
 * Used when httpOnly cross-origin cookies are unavailable (common on iOS PWAs).
 */
export const AUTH_TOKEN_KEY = "authToken";

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  const storage = getBrowserStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(AUTH_TOKEN_KEY);
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    storage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    /* private mode / quota */
  }
}

export function clearAuthToken(): void {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    storage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
