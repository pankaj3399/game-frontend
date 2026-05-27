import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { CreateTournamentModal } from "@/pages/tournaments/components/CreateTournamentModal";
import { useIsOrganiserOrAbove, useAuth, useRequireAuth } from "@/pages/auth/hooks";
import {
  TournamentFilters,
  type TournamentFiltersChangePayload,
} from "@/pages/tournaments/components/TournamentFilters";
import { TournamentActions } from "@/pages/tournaments/components/TournamentActions";
import { TournamentTable } from "@/pages/tournaments/components/TournamentTable";
import { useTournamentFilters } from "@/pages/tournaments/hooks/useTournamentFilters";
import { useTournamentPermissions } from "@/pages/tournaments/hooks/useTournamentPermissions";
import { useTournaments } from "./hooks/useTournaments";
import { useFavoriteClubs } from "@/pages/profile/hooks/useFavoriteClubs";
import InlineLoader from "@/components/shared/InlineLoader";
import { TournamentTableSkeleton } from "@/components/ui/tournament-table-skeleton";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { TW_BREAKPOINT_LG_PX, useMinWidth } from "@/lib/hooks/useMediaQuery";
import { TournamentTab, type TournamentListTab } from "@/models/tournament";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ROLES } from "@/constants/roles";
import { PlusSignIcon, PencilEdit01Icon, IconChevronLeft } from "@/icons/figma-icons";

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
  const [filterApplyPending, setFilterApplyPending] = useState(false);
  const {
    activeTab,
    filters,
    isFiltersHydrated,
    effectiveFilters,
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
    isAuthLoading: authLoading,
    viewSearchParam: searchParams.get("view"),
  });
  const { isDraftTab } = useTournamentPermissions({
    activeTab,
  });

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

  const { data: favoriteClubsData } = useFavoriteClubs({
    enabled: Boolean(user?.id) && !authLoading,
  });
  const homeClubIdForFilters = favoriteClubsData?.homeClub?.id ?? null;
  const favoriteClubsCount = favoriteClubsData?.favoriteClubs?.length ?? 0;

  useEffect(() => {
    if (!authLoading && !homeClubIdForFilters && filters.distance) {
      setDistanceFromValue("all");
    }
  }, [authLoading, filters.distance, homeClubIdForFilters, setDistanceFromValue]);

  const tournamentsQueryEnabled = !authLoading && isFiltersHydrated;
  const { data, error, isPending, isFetching, refetch, isLoadingError } = useTournaments(
    effectiveFilters(),
    tournamentsQueryEnabled,
  );

  const tournaments = data?.tournaments ?? [];
  const pagination = data?.pagination ?? DEFAULT_PAGINATION;
  const loadErrorDetail = error ? getErrorMessage(error) : null;
  const showFullPageLoadError = isLoadingError || (!data && !!error && !isPending);
  const showRefetchErrorBanner = !!error && !!data && !isPending;
  const isListBootstrapping = authLoading || !isFiltersHydrated;
  const showListSkeleton = isListBootstrapping || isPending;
  const isApplyingUserFilters = filterApplyPending && isFetching;

  useEffect(() => {
    if (!filterApplyPending || isFetching) return;
    setFilterApplyPending(false);
  }, [filterApplyPending, isFetching]);
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
      setFilterApplyPending(true);
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
            <div className="flex flex-wrap items-center justify-between gap-2 lg:hidden">
              <TournamentFilters
                open={filtersOpen && !isDesktop}
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
                isApplyingFilters={isApplyingUserFilters}
              />
              <div className="flex items-center gap-2">
                <RoleGuard requireRoleOrAbove={ROLES.ORGANISER}>
                  {activeTab === TournamentTab.Published ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-black/12 bg-white px-2.5 text-[12px]"
                      onClick={() => handleTabChange(TournamentTab.Drafts)}
                    >
                      <PencilEdit01Icon size={14} className="text-foreground" />
                      <span>{t("tournaments.tabDrafts")}</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-black/12 bg-white px-2.5 text-[12px]"
                      onClick={() => handleTabChange(TournamentTab.Published)}
                    >
                      <IconChevronLeft size={14} className="text-foreground" />
                      <span>{t("tournaments.tabPublished")}</span>
                    </Button>
                  )}
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <PlusSignIcon size={15} className="text-white" />
                    <span className="text-[14px] font-medium">{t("tournaments.create")}</span>
                  </Button>
                </RoleGuard>
              </div>
            </div>

            <div className="hidden flex-col gap-4 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <h1 className="text-2xl font-semibold text-foreground">
                {listHeading}
              </h1>
              <TournamentActions
                activeTab={activeTab}
                onTabChange={handleTabChange}
                filtersOpen={filtersOpen && isDesktop}
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
                onCreate={() => setIsCreateModalOpen(true)}
                isApplyingFilters={isApplyingUserFilters}
              />
            </div>
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
              aria-busy={isApplyingUserFilters}
              aria-live="polite"
            >
              <div
                className={cn(
                  "transition-opacity duration-150",
                  isApplyingUserFilters && "opacity-55",
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
              {isApplyingUserFilters ? (
                <div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/40"
                  aria-hidden
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

      <CreateTournamentModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
        tournamentId={null}
      />
    </div>
  );
}
