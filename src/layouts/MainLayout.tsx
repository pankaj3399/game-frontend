import { Outlet } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { LiveMatchModal } from "@/components/live/LiveMatchModal";

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <AppNavbar />
      <main className="flex flex-1 min-w-0 flex-col overflow-x-hidden">
        <Outlet />
      </main>
      <LiveMatchModal />
    </div>
  );
}
