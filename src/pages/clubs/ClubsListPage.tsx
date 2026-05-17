import { ClubsGrid } from "@/pages/clubs/components/list/ClubsGrid";
import { ClubsListHeader } from "@/pages/clubs/components/list/ClubsListHeader";
import { ClubsPagination } from "@/pages/clubs/components/list/ClubsPagination";
import { useClubsListData } from "@/pages/clubs/hooks/useClubsListData";
import { useClubsListFilters } from "@/pages/clubs/hooks/useClubsListFilters";
import { useAdminClubs } from "@/pages/clubs/hooks";
import { useFavoriteClubs } from "@/pages/profile/hooks";
import { useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/errors";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function ClubsListPage() {
  const { t } = useTranslation();
  const { page, limit, query, debouncedQuery, setPage, setQuery, clubScope, distance, setAppliedFilters } =
    useClubsListFilters();
  const { data: favoriteClubsData } = useFavoriteClubs();
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
  const { data: adminClubsData } = useAdminClubs(!hasSuperAdminAccess);
  const canManage = hasSuperAdminAccess || (adminClubsData?.clubs?.length ?? 0) > 0;
  const isSearching = query.trim() !== debouncedQuery.trim();
  const isRefreshingResults = isFetching && !isLoading;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-gray-50">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <ClubsListHeader
            canManage={canManage}
            query={query}
            onQueryChange={setQuery}
            showSearchingHint={isRefreshingResults}
            appliedClubScope={clubScope}
            appliedDistance={distance}
            onApplyFilters={setAppliedFilters}
            hasHomeClub={hasHomeClub}
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
