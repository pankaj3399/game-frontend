
import { useAuth } from "./useAuth";
import {
  type Role,
  ROLES,
  hasRoleOrAbove,
  hasAnyRole,
} from "@/constants/roles";

/**
 * Check if the current user has at least one of the given roles (hierarchy-aware).
 * Super Admin >= Club Admin >= Organiser >= Player
 */
export function useHasRoleOrAbove(required: Role): boolean {
  const { user } = useAuth();
  return user ? hasRoleOrAbove(user?.role, required) : false;
}

/**
 * Check if the current user has exactly one of the given roles.
 */
export function useHasAnyRole(allowed: Role[]): boolean {
  const { user } = useAuth();
  return hasAnyRole(user?.role, allowed);
}

/** Convenience: is Super Admin */
export function useIsSuperAdmin(): boolean {
  return useHasRoleOrAbove(ROLES.SUPER_ADMIN);
}

/** Convenience: Club Admin or above */
export function useIsClubAdminOrAbove(): boolean {
  return useHasRoleOrAbove(ROLES.CLUB_ADMIN);
}

/** Convenience: Organiser or above */
export function useIsOrganiserOrAbove(): boolean {
  return useHasRoleOrAbove(ROLES.ORGANISER);
}
