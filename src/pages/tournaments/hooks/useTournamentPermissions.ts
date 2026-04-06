import { type TournamentListTab } from "@/models/tournament";

interface UseTournamentPermissionsOptions {
  activeTab: TournamentListTab;
  isOrganiserOrAbove: boolean;
}

export function useTournamentPermissions({
  activeTab,
  isOrganiserOrAbove: _isOrganiserOrAbove,
}: UseTournamentPermissionsOptions) {
  const isDraftTab = activeTab === "drafts";

  return {
    isDraftTab,
  };
}
