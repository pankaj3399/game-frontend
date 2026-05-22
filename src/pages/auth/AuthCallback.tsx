import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/pages/auth/hooks";
import {
  consumeReturnPath,
  isValidJwtFormat,
  PENDING_SIGNUP_TOKEN_KEY,
  setAuthToken,
} from "@/lib/auth";

/** Whitelist of safe error codes from backend/auth flow (prevents XSS/open redirect). */
const ALLOWED_ERROR_CODES = new Set([
  "true",
  "apple_error",
  "denied",
  "token",
  "invalid_callback",
  "auth",
  "no_user",
  "no_user_auth",
  "session",
  "state_mismatch",
  "strategy_missing",
  "passport",
  "unknown",
  "crash",
]);

function sanitizeErrorCode(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  return ALLOWED_ERROR_CODES.has(trimmed) ? trimmed : "true";
}

function isValidHandoffCode(code: string): boolean {
  return /^[A-Za-z0-9_-]{16,128}$/.test(code);
}

/** Parses URL fragment (#key=value&...) into a URLSearchParams-like object. */
function parseHashParams(hash: string): URLSearchParams {
  const query = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(query);
}

/** Remove one-time OAuth secrets from the address bar without navigating away. */
function scrubCallbackSecretsFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  params.delete("handoff");
  params.delete("authToken");

  let nextHash = "";
  const rawHash = window.location.hash;
  if (rawHash) {
    const hashParams = new URLSearchParams(
      rawHash.startsWith("#") ? rawHash.slice(1) : rawHash,
    );
    hashParams.delete("handoff");
    hashParams.delete("authToken");
    const serialized = hashParams.toString();
    nextHash = serialized ? `#${serialized}` : "";
  }

  const search = params.toString();
  const url = `${window.location.pathname}${search ? `?${search}` : ""}${nextHash}`;
  window.history.replaceState(null, "", url);
}

/**
 * Handles OAuth callback from backend. Backend redirects here with:
 * - Query params: success=true&handoff=... (logged in), error=... (auth failed), or signup=true&pendingToken=... (complete signup)
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const exchangeStartedRef = useRef(false);

  // Read from query params (primary) and hash (legacy) - fragments can be lost in redirect chains
  const hashParams = parseHashParams(hash);
  const signup =
    searchParams.get("signup") ?? hashParams.get("signup");
  const pendingToken =
    searchParams.get("pendingToken") ?? hashParams.get("pendingToken");
  const success = searchParams.get("success");
  const handoff =
    searchParams.get("handoff") ?? hashParams.get("handoff");
  const error = sanitizeErrorCode(searchParams.get("error"));
  const errorMessage = searchParams.get("errorMessage");
  const signupTokenValid = signup === "true" && !!pendingToken && isValidJwtFormat(pendingToken);
  const derivedError =
    signup === "true" && !signupTokenValid ? "invalid_callback" : error;

  useEffect(() => {
    if (success === "true") {
      if (exchangeStartedRef.current) return;
      exchangeStartedRef.current = true;

      void (async () => {
        try {
          const trimmedHandoff = handoff?.trim() ?? "";
          if (trimmedHandoff && !isValidHandoffCode(trimmedHandoff)) {
            navigate("/login?error=session", { replace: true });
            return;
          }
          if (trimmedHandoff && isValidHandoffCode(trimmedHandoff)) {
            try {
              const res = await api.post<{ token?: string }>("/api/auth/exchange-handoff", {
                handoff: trimmedHandoff,
              });
              const token =
                typeof res.data?.token === "string" ? res.data.token.trim() : "";
              if (!isValidJwtFormat(token)) {
                navigate("/login?error=session", { replace: true });
                return;
              }
              setAuthToken(token);
              scrubCallbackSecretsFromUrl();
            } catch {
              navigate("/login?error=session", { replace: true });
              return;
            }
          }

          const user = await checkAuth();
          if (!user) {
            navigate("/login", { replace: true });
            return;
          }

          const returnPath = consumeReturnPath();
          if (returnPath) {
            navigate(returnPath, { replace: true });
            return;
          }

          const dest =
            user.alias?.trim() && user.name?.trim() ? "/tournaments" : "/information";
          navigate(dest, { replace: true });
        } catch {
          navigate("/login?error=session", { replace: true });
        }
      })();
      return;
    }

    if (signupTokenValid && pendingToken) {
      sessionStorage.setItem(PENDING_SIGNUP_TOKEN_KEY, pendingToken);
      navigate("/information", { replace: true });
      return;
    }

    const params = new URLSearchParams();
    if (derivedError) params.set("error", derivedError);
    if (errorMessage) params.set("errorMessage", errorMessage);
    const nextPath = params.size > 0 ? `/login?${params.toString()}` : "/login";
    navigate(nextPath, { replace: true });
  }, [checkAuth, derivedError, errorMessage, handoff, navigate, pendingToken, signupTokenValid, success]);

  return (
    <section className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Completing sign-in</h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re finishing the authentication flow and redirecting you now.
        </p>
      </div>
    </section>
  );
}
