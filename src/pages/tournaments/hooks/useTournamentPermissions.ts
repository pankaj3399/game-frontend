import { type TournamentListTab } from "@/models/tournament";

interface UseTournamentPermissionsOptions {
  activeTab: TournamentListTab;
}

export function useTournamentPermissions({ activeTab }: UseTournamentPermissionsOptions) {
  const isDraftTab = activeTab === "drafts";

  return {
    isDraftTab,
  };
}
