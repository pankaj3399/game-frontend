import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { AuthContext, type AuthContextValue, type AuthUser } from "./context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<AuthUser | null> => {
    setLoading(true);

    try {
      const res = await api.get<{ user: AuthUser }>("/api/auth/me");
      const nextUser = res.data.user;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // no-op; we still clear local auth state below
    }
    setUser(null);
  }, []);

  const isProfileComplete = !!(user?.alias?.trim() && user?.name?.trim());

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    isProfileComplete,
    checkAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
