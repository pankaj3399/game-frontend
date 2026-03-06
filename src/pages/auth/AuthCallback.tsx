import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AppleFlowDetails from "@/components/auth/AppleFlowDetails";
import {
  PENDING_SIGNUP_TOKEN_KEY,
  clearStoredAppleFlowTrace,
  decodeAppleFlowTrace,
  storeAppleFlowTrace,
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

const AUTO_REDIRECT_DELAY_MS = 1600;

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

  // Read from query params (primary) and hash (legacy) - fragments can be lost in redirect chains
  const hashParams = useMemo(() => parseHashParams(hash), [hash]);
  const signup =
    searchParams.get("signup") ?? hashParams.get("signup");
  const pendingToken =
    searchParams.get("pendingToken") ?? hashParams.get("pendingToken");

  const success = searchParams.get("success");
  const error = sanitizeErrorCode(searchParams.get("error"));
  const errorMessage = searchParams.get("errorMessage");
  const applePayload = useMemo(() => {
    const encoded = searchParams.get("applePayload");
    if (!encoded) return null;
    try {
      let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const padding = base64.length % 4;
      if (padding) base64 += "=".repeat(4 - padding);
      return JSON.parse(atob(base64)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [searchParams]);
  const trace = useMemo(
    () => decodeAppleFlowTrace(searchParams.get("appleFlow") ?? hashParams.get("appleFlow")),
    [hashParams, searchParams]
  );

  const signupTokenValid = signup === "true" && !!pendingToken && isValidJwtFormat(pendingToken);
  const derivedError =
    signup === "true" && !signupTokenValid ? "invalid_callback" : error;

  useEffect(() => {
    if (trace) {
      storeAppleFlowTrace(trace);
      return;
    }

    if (success === "true" || !derivedError) {
      clearStoredAppleFlowTrace();
    }
  }, [derivedError, success, trace]);

  useEffect(() => {
    if (signupTokenValid && pendingToken) {
      sessionStorage.setItem(PENDING_SIGNUP_TOKEN_KEY, pendingToken);
    }
  }, [pendingToken, signupTokenValid]);

  useEffect(() => {
    if (success === "true") {
      const timeout = window.setTimeout(() => {
        navigate("/", { replace: true });
      }, AUTO_REDIRECT_DELAY_MS);
      return () => window.clearTimeout(timeout);
    }

    if (signupTokenValid) {
      const timeout = window.setTimeout(() => {
        navigate("/information", { replace: true });
      }, AUTO_REDIRECT_DELAY_MS);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [navigate, signupTokenValid, success]);

  const title =
    success === "true"
      ? "Apple sign-in succeeded"
      : signupTokenValid
        ? "Apple sign-in succeeded, profile setup required"
        : "Apple sign-in could not be completed";

  const description =
    success === "true"
      ? "Your session was created successfully. You will be redirected to the app in a moment."
      : signupTokenValid
        ? "Authentication worked, but your profile still needs the required signup information."
        : "The callback returned an error or invalid data. Review the trace below for the exact failure point.";

  const nextHref =
    success === "true"
      ? "/"
      : signupTokenValid
        ? "/information"
        : `/login?${new URLSearchParams({
            ...(derivedError ? { error: derivedError } : {}),
            ...(errorMessage ? { errorMessage } : {}),
            ...(searchParams.get("applePayload") ? { applePayload: searchParams.get("applePayload") as string } : {}),
            ...(searchParams.get("appleFlow") ? { appleFlow: searchParams.get("appleFlow") as string } : {}),
          }).toString()}`;

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Apple OAuth callback</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={nextHref}
            replace
            className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-brand-primary-hover"
          >
            {success === "true"
              ? "Continue to the app"
              : signupTokenValid
                ? "Continue to complete signup"
                : "Back to login"}
          </Link>
          {!success && !signupTokenValid ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Reload callback
            </button>
          ) : null}
        </div>
      </div>

      <AppleFlowDetails
        trace={trace}
        errorMessage={
          derivedError === "invalid_callback" && !errorMessage
            ? "The Apple callback did not contain a valid pending signup token or usable callback data."
            : errorMessage
        }
        applePayload={applePayload}
      />
    </section>
  );
}
