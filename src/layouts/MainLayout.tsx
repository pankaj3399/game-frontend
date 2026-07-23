import { Suspense, lazy } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useAuth } from "@/pages/auth/hooks";

const LiveMatchModal = lazy(() =>
  import("@/components/live/LiveMatchModal").then((mod) => ({
    default: mod.LiveMatchModal,
  })),
);

function shouldEnableLiveMatchPolling(pathname: string): boolean {
  if (pathname === "/record-score" || pathname.startsWith("/record-score/")) {
    return false;
  }
  // Poll only where the modal is useful — not on clubs/sponsors/about/admin/settings.
  return (
    pathname.startsWith("/tournaments") ||
    pathname.startsWith("/my-score") ||
    pathname.startsWith("/players/")
  );
}

function LiveMatchGate() {
  const { isAuthenticated, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading || !isAuthenticated || !shouldEnableLiveMatchPolling(pathname)) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <LiveMatchModal />
    </Suspense>
  );
}

/** Home no longer waits on /auth/me; redirect once session resolves. */
function IncompleteProfileGate() {
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const location = useLocation();
  if (
    !loading &&
    isAuthenticated &&
    !isProfileComplete &&
    location.pathname !== "/information"
  ) {
    return <Navigate to="/information" replace />;
  }
  return null;
}

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <IncompleteProfileGate />
      <AppNavbar />
      <main className="flex flex-1 min-w-0 flex-col">
        <Outlet />
      </main>
      <LiveMatchGate />
    </div>
  );
}
