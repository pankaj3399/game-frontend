import { getDraftActionPermissions, type TournamentListTab, type TournamentStatus } from "@/models/tournament";

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

  const getRowPermissions = (status: TournamentStatus) =>
    getDraftActionPermissions({
      activeTab,
      status,
      isOrganiserOrAbove,
    });

  return {
    isDraftTab,
    canShowStatusFilter,
    getRowPermissions,
  };
}
