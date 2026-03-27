import { useAdminClubs, type AdminClub } from "./useAdminClubs";

interface UseClubPageAccessArgs {
  clubId: string | undefined;
  hasSuperAdminAccess: boolean;
}

interface UseClubPageAccessResult {
  selectedClub: AdminClub | null;
  canAccessPage: boolean;
  validatedClubId: string | null;
  clubsLoading: boolean;
  hasAdminClubsError: boolean;
  adminClubsError: unknown;
}

export function useClubPageAccess({
  clubId,
  hasSuperAdminAccess,
}: UseClubPageAccessArgs): UseClubPageAccessResult {
  const {
    data: adminClubsData,
    isLoading: clubsLoading,
    isError: adminClubsQueryError,
    error: adminClubsError,
  } = useAdminClubs(!hasSuperAdminAccess);

  const hasAdminClubsError =
    !hasSuperAdminAccess && (adminClubsQueryError || adminClubsError !== null);
  const selectedClub =
    (adminClubsData?.clubs ?? []).find((club) => club.id === clubId) ?? null;
  const isAdminAccessCheckPending = !hasSuperAdminAccess && clubsLoading;
  const canAccessPage = hasSuperAdminAccess || selectedClub !== null;
  const validatedClubId =
    !isAdminAccessCheckPending && canAccessPage ? (clubId ?? null) : null;

  return {
    selectedClub,
    canAccessPage,
    validatedClubId,
    clubsLoading,
    hasAdminClubsError,
    adminClubsError,
  };
}