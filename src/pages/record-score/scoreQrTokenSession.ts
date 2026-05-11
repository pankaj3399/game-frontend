const SCORE_QR_TOKEN_REF_PREFIX = "scoreQrToken:";
const SCORE_QR_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

type StoredScoreQrToken = {
  token: string;
  storedAt: number;
};

function safeSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function scoreQrTokenKey(ref: string): string {
  return `${SCORE_QR_TOKEN_REF_PREFIX}${ref}`;
}

function createTokenRef(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function storeScoreQrToken(token: string): string | null {
  const normalized = token.trim();
  if (!normalized) return null;

  const storage = safeSessionStorage();
  if (!storage) return null;

  const ref = createTokenRef();
  const payload: StoredScoreQrToken = {
    token: normalized,
    storedAt: Date.now(),
  };

  try {
    storage.setItem(scoreQrTokenKey(ref), JSON.stringify(payload));
    return ref;
  } catch {
    return null;
  }
}

export function readScoreQrToken(ref: string | null | undefined): string {
  const normalizedRef = ref?.trim();
  if (!normalizedRef) return "";

  const storage = safeSessionStorage();
  if (!storage) return "";

  try {
    const raw = storage.getItem(scoreQrTokenKey(normalizedRef));
    if (!raw) return "";

    const parsed = JSON.parse(raw) as Partial<StoredScoreQrToken>;
    const token = typeof parsed.token === "string" ? parsed.token.trim() : "";
    const storedAt = typeof parsed.storedAt === "number" ? parsed.storedAt : 0;

    if (!token || Date.now() - storedAt > SCORE_QR_TOKEN_MAX_AGE_MS) {
      return "";
    }

    return token;
  } catch {
    return "";
  }
}

/** Removes any session entry for this ref (stale, expired, or user-dismissed). */
export function pruneScoreQrToken(ref: string | null | undefined) {
  const normalizedRef = ref?.trim();
  if (!normalizedRef) return;

  const storage = safeSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(scoreQrTokenKey(normalizedRef));
  } catch {
    // Best-effort cleanup only.
  }
}

export function clearScoreQrToken(ref: string | null | undefined) {
  pruneScoreQrToken(ref);
}

/**
 * Moves a raw `token` query param into session (`qrRef`) or navigation state so the URL
 * no longer exposes the secret. Caller should `navigate({ search }, { replace, state })`.
 */
export function buildConfirmScoreQrLocationAfterTokenPromotion(
  currentSearchParams: URLSearchParams,
  tokenFromQuery: string,
): { search: string; navigationState?: { scoreQrToken: string } } {
  const nextParams = new URLSearchParams(currentSearchParams);
  nextParams.delete("token");
  nextParams.delete("scoreQrToken");

  const storedRef = storeScoreQrToken(tokenFromQuery);
  if (storedRef) {
    nextParams.set("qrRef", storedRef);
    return {
      search: nextParams.toString() ? `?${nextParams.toString()}` : "",
    };
  }

  nextParams.set("scoreQrToken", tokenFromQuery);
  return {
    search: nextParams.toString() ? `?${nextParams.toString()}` : "",
    navigationState: { scoreQrToken: tokenFromQuery },
  };
}
