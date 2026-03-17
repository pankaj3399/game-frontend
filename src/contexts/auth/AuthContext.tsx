import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { AuthContext, type AuthContextValue, type AuthUser } from "./context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async (): Promise<AuthUser | null> => {
    try {
      const res = await api.get<{ user: AuthUser }>("/api/auth/me");
      const u = res.data.user;
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    // No dependencies needed, safe due to React Compiler
  }, []);

  async function logout() {
    try {
      await api.post("/api/auth/logout");
      setUser(null);
    } catch {
      setUser(null);
    }
  }

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
