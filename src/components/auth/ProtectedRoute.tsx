import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth";
import type { Role } from "@/constants/roles";
import { hasRoleOrAbove, hasAnyRole } from "@/constants/roles";
import Loader from "@/components/shared/Loader";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Require at least one of these roles (hierarchy-aware). Omit for auth-only. */
  requireRoleOrAbove?: Role;
  /** Require exactly one of these roles (no hierarchy). Use instead of requireRoleOrAbove. */
  requireExactRoles?: Role[];
  /** Where to redirect when unauthorized. Default: /login */
  redirectTo?: string;
}

/**
 * Protects routes by requiring authentication and optionally specific roles.
 * Use requireRoleOrAbove for hierarchy checks (e.g. club_admin allows super_admin).
 * Use requireExactRoles for exact role matching.
 */
export function ProtectedRoute({
  children,
  requireRoleOrAbove,
  requireExactRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requireExactRoles && requireExactRoles.length > 0) {
    const hasAccess = hasAnyRole(user?.role, requireExactRoles);
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  } else if (requireRoleOrAbove) {
    const hasAccess = hasRoleOrAbove(user?.role, requireRoleOrAbove);
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
