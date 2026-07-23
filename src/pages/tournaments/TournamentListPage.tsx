import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { useIsOrganiserOrAbove, useAuth, useRequireAuth } from "@/pages/auth/hooks";
import type { TournamentFiltersChangePayload } from "@/pages/tournaments/components/TournamentFilters";
import {
  TournamentFilterTrigger,
  countActiveTournamentFilters,
} from "@/pages/tournaments/components/TournamentFilterTrigger";
import { TournamentActions } from "@/pages/tournaments/components/TournamentActions";
import { TournamentTable } from "@/pages/tournaments/components/TournamentTable";
import { useTournamentFilters } from "@/pages/tournaments/hooks/useTournamentFilters";
import { useTournaments } from "./hooks/useTournaments";
import { useFavoriteClubs } from "@/pages/profile/hooks/useFavoriteClubs";
import InlineLoader from "@/components/shared/InlineLoader";
import { TournamentTableSkeleton } from "@/components/ui/tournament-table-skeleton";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { TW_BREAKPOINT_LG_PX, useMinWidth } from "@/lib/hooks/useMediaQuery";
import { TournamentTab, type TournamentListTab } from "@/models/tournament";

const CreateTournamentModal = lazy(() =>
  import("@/pages/tournaments/components/CreateTournamentModal").then((mod) => ({
    default: mod.CreateTournamentModal,
  })),
);

const TournamentFilters = lazy(() =>
  import("@/pages/tournaments/components/TournamentFilters").then((mod) => ({
    default: mod.TournamentFilters,
  })),
);

const OrganiserListButtons = lazy(() =>
  import("@/pages/tournaments/components/OrganiserListButtons").then((mod) => ({
    default: mod.OrganiserListButtons,
  })),
);

export default function TournamentListPage() {
  return <TournamentListContent />;
}
const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
} as const;

function TournamentListContent() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useMinWidth(TW_BREAKPOINT_LG_PX);
  const isOrganiserOrAbove = useIsOrganiserOrAbove();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApplyingUserFilters, setIsApplyingUserFilters] = useState(false);
  const [mobileFiltersMounted, setMobileFiltersMounted] = useState(false);
  const {
    activeTab,
    filters,
    shapedFilters,
    filtersOpen,
    setFiltersOpen,
    setTab,
    setWhenFromValue,
    setDistanceFromValue,
    setClubFilter,
    setParticipationFromValue,
    setPage,
  } = useTournamentFilters({
    isOrganiserOrAbove,
    userId: user?.id ?? undefined,
    viewSearchParam: searchParams.get("view"),
  });
  const isDraftTab = activeTab === TournamentTab.Drafts;
  const showMobileFilters = mobileFiltersMounted || filtersOpen;

  const openMobileFilters = useCallback(() => {
    setMobileFiltersMounted(true);
    setFiltersOpen(true);
  }, [setFiltersOpen]);

  const openCreateModal = useCallback(() => setIsCreateModalOpen(true), []);

  const handleTabChange = useCallback(
    (tab: TournamentListTab) => {
      setTab(tab);
      if (!isOrganiserOrAbove) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("view", tab === TournamentTab.Drafts ? "drafts" : "published");
          return next;
        },
        { replace: true }
      );
    },
    [isOrganiserOrAbove, setSearchParams, setTab]
  );

  // Favorites only when filters UI needs home/favorites (not on every list cold load).
  const needsFavoriteClubs =
    Boolean(user?.id) &&
    !authLoading &&
    (filtersOpen ||
      Boolean(filters.distance) ||
      filters.clubScope === "favorites");

  const { data: favoriteClubsData } = useFavoriteClubs({
    enabled: needsFavoriteClubs,
  });
  const homeClubIdForFilters = favoriteClubsData?.homeClub?.id ?? null;
  const favoriteClubsCount = favoriteClubsData?.favoriteClubs?.length ?? 0;

  // Clamp distance at query time when home club is unknown/absent — no syncing effect.
  const listFilters = useMemo(() => {
    if (homeClubIdForFilters || !shapedFilters.distance) return shapedFilters;
    return { ...shapedFilters, distance: undefined };
  }, [shapedFilters, homeClubIdForFilters]);

  const mobileActiveFilterCount = countActiveTournamentFilters({
    when: filters.when,
    distance:
      homeClubIdForFilters &&
      filters.distance &&
      filters.distance !== "over80"
        ? filters.distance
        : undefined,
    clubId: filters.clubId,
    clubScope: filters.clubScope,
    participation: filters.participation,
  });

  const { data, error, isPending, isFetching, refetch, isLoadingError } = useTournaments(
    listFilters,
    true,
  );

  const tournaments = data?.tournaments ?? [];
  const pagination = data?.pagination ?? DEFAULT_PAGINATION;
  const loadErrorDetail = error ? getErrorMessage(error) : null;
  const showFullPageLoadError = isLoadingError || (!data && !!error && !isPending);
  const showRefetchErrorBanner = !!error && !!data && !isPending;
  const showListSkeleton = isPending;
  const showApplyingOverlay = isApplyingUserFilters && isFetching;

  useEffect(() => {
    if (!isApplyingUserFilters || isFetching) return;
    setIsApplyingUserFilters(false);
  }, [isApplyingUserFilters, isFetching]);

  const listHeading =
    activeTab === TournamentTab.Drafts
      ? t("tournaments.tabDrafts")
      : t("tournaments.Tournaments");
  const handleFiltersChange = useCallback(
    (next: TournamentFiltersChangePayload) => {
      if (
        !isAuthenticated &&
        (next.clubScope === "favorites" ||
          (next.distance !== undefined && next.distance !== "all"))
      ) {
        requireAuth();
        return;
      }
      setWhenFromValue(next.when);
      setDistanceFromValue(
        homeClubIdForFilters && next.distance !== "all" ? next.distance : "all",
      );
      if (next.clubScope === "favorites") {
        setClubFilter({ clubScope: "favorites" });
      } else {
        setClubFilter({ clubId: next.clubId });
      }
      setParticipationFromValue(next.participation ?? "all");
      setIsApplyingUserFilters(true);
    },
    [
      homeClubIdForFilters,
      isAuthenticated,
      requireAuth,
      setClubFilter,
      setDistanceFromValue,
      setWhenFromValue,
      setParticipationFromValue,
    ]
  );
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-[#f8fbf8] lg:min-h-[calc(100vh-60px)]">
      <div className="mx-auto w-full max-w-[440px] flex-1 px-3 pb-6 pt-6 sm:max-w-none sm:px-4 sm:pb-8 sm:pt-7 lg:max-w-[1060px] lg:px-6 lg:py-8">
        <div className="overflow-hidden rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]">
          <div className="px-4 pb-4 pt-5 sm:px-5 lg:py-4">
            <h1 className="sr-only lg:hidden">{listHeading}</h1>
            {!isDesktop ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              {showMobileFilters ? (
                <Suspense
                  fallback={
                    <TournamentFilterTrigger
                      label={t("tournaments.filters")}
                      activeFilterCount={mobileActiveFilterCount}
                      open={filtersOpen}
                      onOpen={openMobileFilters}
                    />
                  }
                >
                  <TournamentFilters
                    variant="bottom-sheet"
                    open={filtersOpen}
                    onOpenChange={setFiltersOpen}
                    filters={{
                      when: filters.when,
                      distance: filters.distance,
                      clubId: filters.clubId,
                      clubScope: filters.clubScope,
                      participation: filters.participation,
                    }}
                    homeClubId={homeClubIdForFilters}
                    favoriteClubsCount={favoriteClubsCount}
                    isAuthenticated={isAuthenticated}
                    onFiltersChange={handleFiltersChange}
                    isApplyingFilters={showApplyingOverlay}
                  />
                </Suspense>
              ) : (
                <TournamentFilterTrigger
                  label={t("tournaments.filters")}
                  activeFilterCount={mobileActiveFilterCount}
                  open={false}
                  onOpen={openMobileFilters}
                />
              )}
              <div className="flex items-center gap-2">
                {isOrganiserOrAbove ? (
                  <Suspense fallback={null}>
                    <OrganiserListButtons
                      compact
                      activeTab={activeTab}
                      onTabChange={handleTabChange}
                      onCreate={openCreateModal}
                    />
                  </Suspense>
                ) : null}
              </div>
            </div>
            ) : (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <h1 className="text-2xl font-semibold text-foreground">
                {listHeading}
              </h1>
              <TournamentActions
                activeTab={activeTab}
                onTabChange={handleTabChange}
                filtersOpen={filtersOpen}
                onFiltersOpenChange={setFiltersOpen}
                when={filters.when}
                distance={filters.distance}
                clubId={filters.clubId}
                clubScope={filters.clubScope}
                participation={filters.participation}
                homeClubId={homeClubIdForFilters}
                favoriteClubsCount={favoriteClubsCount}
                isAuthenticated={isAuthenticated}
                onFiltersChange={handleFiltersChange}
                onCreate={openCreateModal}
                isApplyingFilters={showApplyingOverlay}
                showOrganiserActions={isOrganiserOrAbove}
              />
            </div>
            )}
          </div>

          {showListSkeleton ? (
            <TournamentTableSkeleton />
          ) : showFullPageLoadError ? (
            <div
              className="space-y-4 px-4 py-10 text-center sm:px-6 sm:py-12"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-muted-foreground">{t("tournaments.listLoadError")}</p>
              {loadErrorDetail ? (
                <p className="text-sm text-muted-foreground/90">{loadErrorDetail}</p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetching}
                aria-busy={isFetching}
                onClick={() => void refetch()}
              >
                {t("tournaments.retry")}
              </Button>
            </div>
          ) : (
            <div
              className="relative min-h-[160px]"
              aria-busy={showApplyingOverlay}
              aria-live="polite"
            >
              <div
                className={cn(
                  "transition-opacity duration-150",
                  showApplyingOverlay && "opacity-55",
                )}
              >
              {showRefetchErrorBanner ? (
                <div
                  className="flex flex-col gap-2 border-b border-destructive/20 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
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
                    aria-busy={isFetching}
                    onClick={() => void refetch()}
                  >
                    {t("tournaments.retry")}
                  </Button>
                </div>
              ) : null}
              {tournaments.length === 0 ? (
                <div className="px-4 py-10 text-center sm:px-6 sm:py-12">
                  <p className="text-sm text-muted-foreground sm:text-base">
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
                  listHeading={listHeading}
                />
              )}
              </div>
              {showApplyingOverlay ? (
                <div
                  className="pointer-events-none fixed inset-x-0 top-[56px] bottom-0 z-40 flex items-center justify-center bg-white/40 lg:top-[60px]"
                  role="status"
                  aria-live="polite"
                  aria-label={t("tournaments.filterApplying")}
                >
                  <InlineLoader className="border-[#010a04]/20 border-t-[#067429]" />
                </div>
              ) : null}
            </div>
          )}

          <PaginationBar
            pagination={pagination}
            onPageChange={setPage}
            className="border-t border-black/8 px-4 py-3 sm:px-5"
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

      {isCreateModalOpen ? (
        <Suspense fallback={null}>
          <CreateTournamentModal
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
            mode="create"
            tournamentId={null}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
