import { ClubsGrid } from "@/pages/clubs/components/list/ClubsGrid";
import { ClubsListHeader } from "@/pages/clubs/components/list/ClubsListHeader";
import { ClubsPagination } from "@/pages/clubs/components/list/ClubsPagination";
import { useClubsListData } from "@/pages/clubs/hooks/useClubsListData";
import { useClubsListFilters } from "@/pages/clubs/hooks/useClubsListFilters";
import { useAdminClubs } from "@/pages/clubs/hooks";
import { useFavoriteClubs } from "@/pages/profile/hooks";
import { useAuth, useHasRoleOrAbove, useRequireAuth } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/errors";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ClubsListPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { requireAuth } = useRequireAuth();
  const { page, limit, query, debouncedQuery, setPage, setQuery, clubScope, distance, setAppliedFilters } =
    useClubsListFilters();
  const { data: favoriteClubsData } = useFavoriteClubs({ enabled: isAuthenticated });
  const hasHomeClub = Boolean(favoriteClubsData?.homeClub);

  const {
    clubs,
    pagination,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useClubsListData({
    page,
    limit,
    q: debouncedQuery,
    clubScope,
    distance,
  });
  const hasSuperAdminAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);
  const { data: adminClubsData } = useAdminClubs(
    isAuthenticated && !hasSuperAdminAccess,
  );
  const canManage = hasSuperAdminAccess || (adminClubsData?.clubs?.length ?? 0) > 0;
  const isSearching = query.trim() !== debouncedQuery.trim();
  const isRefreshingResults = isFetching && !isLoading;

  const handleApplyFilters = (next: {
    clubScope: typeof clubScope;
    distance: typeof distance;
  }) => {
    if (
      !isAuthenticated &&
      (next.clubScope !== "all" || next.distance !== "all")
    ) {
      requireAuth();
      return;
    }
    setAppliedFilters(next);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto box-border w-full min-w-0 max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="min-w-0 w-full rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6">
          <ClubsListHeader
            canManage={canManage}
            query={query}
            onQueryChange={setQuery}
            showSearchingHint={isRefreshingResults}
            appliedClubScope={clubScope}
            appliedDistance={distance}
            onApplyFilters={handleApplyFilters}
            hasHomeClub={hasHomeClub}
            onManageClubs={requireAuth}
            onRequiresHomeClub={() => {
              if (!isAuthenticated) {
                requireAuth();
                return;
              }
              toast.info(t("clubs.filterDistanceRequiresHome"));
            }}
          />

          {isError ? (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <p>{getErrorMessage(error) ?? t("clubs.listLoadError")}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
                {t("clubs.listRetry")}
              </Button>
            </div>
          ) : (
            <>
              <ClubsGrid
                clubs={clubs}
                query={debouncedQuery}
                isSearching={isSearching}
                isLoading={isLoading}
                onClearSearch={() => setQuery("")}
              />
              {!isSearching && pagination.totalCount > 0 && (
                <ClubsPagination pagination={pagination} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
