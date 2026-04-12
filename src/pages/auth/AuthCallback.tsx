import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/pages/auth/hooks";
import { PENDING_SIGNUP_TOKEN_KEY } from "@/lib/auth";

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

/** Basic JWT format check (3 base64 parts) before storing. Backend does full verification. */
function isValidJwtFormat(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p));
}

/** Parses URL fragment (#key=value&...) into a URLSearchParams-like object. */
function parseHashParams(hash: string): URLSearchParams {
  const query = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(query);
}

/**
 * Handles OAuth callback from backend. Backend redirects here with:
 * - Query params: success=true (logged in), error=... (auth failed), or signup=true&pendingToken=... (complete signup)
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  // Read from query params (primary) and hash (legacy) - fragments can be lost in redirect chains
  const hashParams = parseHashParams(hash);
  const signup =
    searchParams.get("signup") ?? hashParams.get("signup");
  const pendingToken =
    searchParams.get("pendingToken") ?? hashParams.get("pendingToken");
  const success = searchParams.get("success");
  const error = sanitizeErrorCode(searchParams.get("error"));
  const errorMessage = searchParams.get("errorMessage");
  const signupTokenValid = signup === "true" && !!pendingToken && isValidJwtFormat(pendingToken);
  const derivedError =
    signup === "true" && !signupTokenValid ? "invalid_callback" : error;

  useEffect(() => {
    if (success === "true") {
      checkAuth().then((user) => {
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }
        // Sign-in: complete profile → tournaments; otherwise complete signup on /information
        const dest = user.alias?.trim() && user.name?.trim() ? "/tournaments" : "/information";
        navigate(dest, { replace: true });
      });
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
  }, [checkAuth, derivedError, errorMessage, navigate, pendingToken, signupTokenValid, success]);

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
