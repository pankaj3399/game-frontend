import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import InlineLoader from "@/components/shared/InlineLoader";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { CreateTournamentModal } from "@/pages/tournaments/components/CreateTournamentModal";
import { useIsOrganiserOrAbove } from "@/pages/auth/hooks";
import { TournamentActions } from "@/pages/tournaments/components/TournamentActions";
import { TournamentTable } from "@/pages/tournaments/components/TournamentTable";
import { Input } from "@/components/ui/input";
import { Search01Icon } from "@/icons/figma-icons";
import { useTournamentFilters } from "@/pages/tournaments/hooks/useTournamentFilters";
import { useTournamentPermissions } from "@/pages/tournaments/hooks/useTournamentPermissions";
import { useTournaments } from "./hooks/useTournaments";
import { useAuth } from "@/pages/auth/hooks";
import { TournamentTableSkeleton } from "@/components/ui/tournament-table-skeleton";
import { getErrorMessage } from "@/lib/errors";

export default function TournamentListPage() {
  return <TournamentListContent/>;
}


const DEFAULT_PAGINATION =  {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
}

export const TournamentTab = {
  Drafts: "drafts",
  Published: "published",
} as const;

function TournamentListContent() {
  const { t, i18n } = useTranslation();
  const isOrganiserOrAbove = useIsOrganiserOrAbove();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const listSearchLabelId = useId();
  const {
    activeTab,
    filters,
    effectiveFilters,
    filtersOpen,
    setFiltersOpen,
    setTab,
    setWhenFromValue,
    setDistanceFromValue,
    setClubId,
    setQuery,
    setPage,
  } = useTournamentFilters({ isOrganiserOrAbove, userId: user?.id ?? undefined });
  const { isDraftTab } = useTournamentPermissions({
    activeTab,
  });

  const { data, error, isPending, isFetching, refetch, isLoadingError } = useTournaments(
    effectiveFilters()
  );

  const tournaments = data?.tournaments ?? [];
  const pagination = data?.pagination ?? DEFAULT_PAGINATION;
  const loadErrorDetail = error ? getErrorMessage(error) : null;
  const showFullPageLoadError = isLoadingError || (!data && !!error && !isPending);
  const showRefetchErrorBanner = !!error && !!data && !isPending;
  const handleFiltersChange = (next: { when: string; distance: string; clubId?: string }) => {
    setWhenFromValue(next.when);
    setDistanceFromValue(next.distance);
    setClubId(next.clubId);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-brand-primary/[0.03]">
      <div className="mx-auto w-full max-w-[1060px] flex-1 px-4 py-8 sm:px-6">
        <div className="overflow-y-hidden overflow-x-auto rounded-[12px] border border-black/10 bg-white shadow-sm">
          <div className="px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold leading-tight text-foreground">
                {activeTab === TournamentTab.Drafts
                  ? t("tournaments.tabDrafts")
                  : t("tournaments.allTournaments")}
              </h1>
              <TournamentActions
                activeTab={activeTab}
                onTabChange={setTab}
                filtersOpen={filtersOpen}
                onFiltersOpenChange={setFiltersOpen}
                when={filters.when}
                distance={filters.distance}
                clubId={filters.clubId}
                onFiltersChange={handleFiltersChange}
                onCreate={() => setIsCreateModalOpen(true)}
              />
            </div>

            <div className="border-t border-black/[0.08] pt-3 pb-1 sm:pt-3.5 sm:pb-2">
              <div className="relative">
                <Search01Icon
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={filters.q ?? ""}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("tournaments.filterSearchPlaceholder")}
                  aria-labelledby={listSearchLabelId}
                  autoComplete="off"
                  className="h-10 w-full rounded-xl border-black/12 bg-black/[0.025] pl-10 text-sm placeholder:text-black/35 focus:border-brand-primary/40 focus:bg-white"
                />
                <span id={listSearchLabelId} className="sr-only">
                  {t("tournaments.filterSearch")}
                </span>
              </div>
            </div>
          </div>

          {isPending ? (
            <TournamentTableSkeleton />
          ) : showFullPageLoadError ? (
            <div className="space-y-4 px-6 py-12 text-center">
              <p className="text-muted-foreground">{t("tournaments.listLoadError")}</p>
              {loadErrorDetail ? (
                <p className="text-sm text-muted-foreground/90">{loadErrorDetail}</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                {isFetching ? t("common.loading") : t("tournaments.retry")}
              </Button>
            </div>
          ) : (
            <>
              {showRefetchErrorBanner ? (
                <div className="flex flex-col gap-2 border-b border-destructive/20 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-sm text-muted-foreground">
                    {t("tournaments.listLoadError")}
                    {loadErrorDetail ? (
                      <span className="mt-1 block text-xs text-muted-foreground/90">
                        {loadErrorDetail}
                      </span>
                    ) : null}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 self-start sm:self-auto"
                    disabled={isFetching}
                    onClick={() => void refetch()}
                  >
                    {isFetching ? t("common.loading") : t("tournaments.retry")}
                  </Button>
                </div>
              ) : null}
              {tournaments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-muted-foreground">
                    {isDraftTab
                      ? t("tournaments.noDrafts")
                      : t("tournaments.noTournaments")}
                  </p>
                </div>
              ) : (
                <TournamentTable
                  tournaments={tournaments}
                  pagination={pagination}
                  language={i18n.language}
                />
              )}
            </>
          )}

          {isFetching && !isPending ? (
            <div className="border-t border-black/10 px-4 py-2">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <InlineLoader size="sm" />
                {t("common.loading")}
              </div>
            </div>
          ) : null}

          <PaginationBar
            pagination={pagination}
            onPageChange={setPage}
            prevLabel={t("tournaments.prev")}
            nextLabel={t("tournaments.next")}
            info={({ from, to, total }) =>
              t("tournaments.paginationInfo", {
                from,
                to,
                total,
              })
            }
          />
        </div>
      </div>

      <CreateTournamentModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
        tournamentId={null}
      />
    </div>
  );
}

