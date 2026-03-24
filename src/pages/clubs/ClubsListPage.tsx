import { useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import InlineLoader from "@/components/shared/InlineLoader";
import { ClubsGrid } from "@/pages/clubs/components/list/ClubsGrid";
import { ClubsListHeader } from "@/pages/clubs/components/list/ClubsListHeader";
import { ClubsPagination } from "@/pages/clubs/components/list/ClubsPagination";
import { useClubsListData } from "@/pages/clubs/hooks/useClubsListData";
import { useClubsListFilters } from "@/pages/clubs/hooks/useClubsListFilters";

export default function ClubsListPage() {
  const { page, limit, query, debouncedQuery, setPage, setQuery } = useClubsListFilters();
  const { clubs, pagination, isLoading } = useClubsListData({
    page,
    limit,
    q: debouncedQuery,
  });
  const canManage = useHasRoleOrAbove(ROLES.ORGANISER);
  const isSearching = query.trim() !== debouncedQuery.trim();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-gray-50">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <ClubsListHeader canManage={canManage} query={query} onQueryChange={setQuery} />

          {isLoading ? (
            <div className="flex justify-center py-16">
              <InlineLoader />
            </div>
          ) : (
            <>
              <ClubsGrid
                clubs={clubs}
                query={debouncedQuery}
                isSearching={isSearching}
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
