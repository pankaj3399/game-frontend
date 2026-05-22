import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginPathWithReturn, saveReturnPath } from "@/lib/auth/returnPath";
import { useAuth } from "./useAuth";

/**
 * Redirects guests to /login and remembers where they came from (OAuth-safe).
 * Returns true when the user is authenticated.
 */
export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = useCallback(() => {
    if (loading) return false;
    if (isAuthenticated) return true;

    const returnPath = `${location.pathname}${location.search}`;
    saveReturnPath(returnPath);
    navigate(loginPathWithReturn(returnPath), {
      replace: false,
      state: { from: location },
    });
    return false;
  }, [isAuthenticated, loading, location, navigate]);

  return { isAuthenticated, loading, requireAuth };
}
