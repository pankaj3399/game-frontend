import { Navigate } from "react-router-dom";
import { useAuth } from "@/pages/auth/hooks";
import { PENDING_SIGNUP_TOKEN_KEY } from "@/lib/auth";
import { UserInformationContent } from "@/pages/user/UserInformationContent";

export default function UserInformation() {
  const { isAuthenticated, isProfileComplete, loading: authLoading } = useAuth();
  const pendingToken = sessionStorage.getItem(PENDING_SIGNUP_TOKEN_KEY);

  if (authLoading) {
    return null;
  }

  if (isAuthenticated && isProfileComplete) return <Navigate to="/profile" replace />;
  if (!isAuthenticated && !pendingToken) return <Navigate to="/login" replace />;
  return <UserInformationContent pendingToken={pendingToken} />;
}
