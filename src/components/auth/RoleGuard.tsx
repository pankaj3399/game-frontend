import { useAuth } from "@/pages/auth/hooks";
import type { Role } from "@/constants/roles";
import { hasRoleOrAbove, hasAnyRole } from "@/constants/roles";

export interface RoleGuardProps {
  children: React.ReactNode;
  /** Require at least one of these roles (hierarchy-aware). */
  requireRoleOrAbove?: Role;
  /** Require exactly one of these roles (no hierarchy). */
  requireExactRoles?: Role[];
  /** Optional fallback when user lacks permission. Omit to render nothing. */
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on user role.
 * Use for hiding UI elements (e.g. admin links) from users without permission.
 */
export function RoleGuard({
  children,
  requireRoleOrAbove,
  requireExactRoles,
  fallback = null,
}: RoleGuardProps) {
  const { user } = useAuth();

  // If both are provided, requireExactRoles takes precedence so exact-role checks are never silently bypassed.
  if (Array.isArray(requireExactRoles)) {
    if (requireExactRoles.length === 0) {
      return <>{fallback}</>;
    }
    const hasAccess = hasAnyRole(user?.role, requireExactRoles);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  if (requireRoleOrAbove) {
    const hasAccess = hasRoleOrAbove(user?.role, requireRoleOrAbove);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  return <>{children}</>;
}
