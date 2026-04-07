import { type TournamentListTab } from "@/models/tournament";

interface UseTournamentPermissionsOptions {
  activeTab: TournamentListTab;
  isOrganiserOrAbove: boolean;
}

export function useTournamentPermissions({ activeTab }: UseTournamentPermissionsOptions) {
  const isDraftTab = activeTab === "drafts";

  return {
    isDraftTab,
  };
}
