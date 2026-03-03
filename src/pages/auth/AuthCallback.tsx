import { useSearchParams, useLocation, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { PENDING_SIGNUP_TOKEN_KEY } from "@/lib/auth";

/** Whitelist of safe error codes from backend/auth flow (prevents XSS/open redirect). */
const ALLOWED_ERROR_CODES = new Set(["true", "denied", "token", "invalid_callback"]);

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

  // Read from query params (primary) and hash (legacy) - fragments can be lost in redirect chains
  const hashParams = useMemo(() => parseHashParams(hash), [hash]);
  const signup =
    searchParams.get("signup") ?? hashParams.get("signup");
  const pendingToken =
    searchParams.get("pendingToken") ?? hashParams.get("pendingToken");

  const success = searchParams.get("success");
  const error = sanitizeErrorCode(searchParams.get("error"));

  if (success === "true") return <Navigate to="/" replace />;

  if (signup === "true" && pendingToken) {
    if (!isValidJwtFormat(pendingToken)) {
      return <Navigate to="/login?error=invalid_callback" replace />;
    }
    sessionStorage.setItem(PENDING_SIGNUP_TOKEN_KEY, pendingToken);
    return <Navigate to="/information" replace />;
  }

  if (signup === "true" && !pendingToken) {
    return <Navigate to="/login?error=invalid_callback" replace />;
  }

  if (error) return <Navigate to={"/login?error=" + encodeURIComponent(error)} replace />;

  return <Navigate to="/login" replace />;
}
