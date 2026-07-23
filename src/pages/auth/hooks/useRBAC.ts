import { useAuth } from "./useAuth";
import {
  type Role,
  ROLES,
  hasRoleOrAbove,
} from "@/constants/roles";

/**
 * Check if the current user has at least one of the given roles (hierarchy-aware).
 * Super Admin >= Club Admin >= Organiser >= Player
 */
export function useHasRoleOrAbove(required: Role): boolean {
  const { user } = useAuth();
  return user ? hasRoleOrAbove(user?.role, required) : false;
}

/** Convenience: Organiser or above */
export function useIsOrganiserOrAbove(): boolean {
  return useHasRoleOrAbove(ROLES.ORGANISER);
}
