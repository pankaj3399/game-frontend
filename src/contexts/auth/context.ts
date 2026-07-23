import { createContext } from "react";
import type { Role } from "@/constants/roles";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  alias?: string | null;
  profilePictureUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  userType?: string;
  /** RBAC role: player, organiser, club_admin, super_admin */
  role?: Role;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  checkAuth: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  /** True when the server explicitly reported the user is unauthenticated (401/403/404) */
  confirmedUnauthenticated: boolean;
  /** True when the auth check failed due to network or server errors (retryable) */
  authCheckFailed: boolean;
  /** Stable message when authCheckFailed; prefer over raw Error identity. */
  authError?: unknown;
  /** Whether the failure is likely retryable (network / 5xx) */
  isRetryable?: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
