import { type TournamentListTab } from "@/models/tournament";

interface UseTournamentPermissionsOptions {
  activeTab: TournamentListTab;
  isOrganiserOrAbove: boolean;
}

export function useTournamentPermissions({
  activeTab,
  isOrganiserOrAbove,
}: UseTournamentPermissionsOptions) {
  const isDraftTab = activeTab === "drafts";
  const canShowStatusFilter = !isOrganiserOrAbove || activeTab === "published";

  return {
    isDraftTab,
    canShowStatusFilter,
  };
}
