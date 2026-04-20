import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import InlineLoader from "@/components/shared/InlineLoader";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { CreateTournamentModal } from "@/pages/tournaments/components/CreateTournamentModal";
import { useIsOrganiserOrAbove } from "@/pages/auth/hooks";
import { TournamentFilters } from "@/pages/tournaments/components/TournamentFilters";
import { TournamentActions } from "@/pages/tournaments/components/TournamentActions";
import { TournamentTable } from "@/pages/tournaments/components/TournamentTable";
import { useTournamentFilters } from "@/pages/tournaments/hooks/useTournamentFilters";
import { useTournamentPermissions } from "@/pages/tournaments/hooks/useTournamentPermissions";
import { useTournaments } from "./hooks/useTournaments";
import { useAuth } from "@/pages/auth/hooks";
import { TournamentTableSkeleton } from "@/components/ui/tournament-table-skeleton";
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
  const { user, loading: authLoading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const { data, error, isPending, isFetching, refetch, isLoadingError } = useTournaments(
    effectiveFilters()
  );

  const tournaments = data?.tournaments ?? [];
  const pagination = data?.pagination ?? DEFAULT_PAGINATION;
  const loadErrorDetail = error ? getErrorMessage(error) : null;
  const showFullPageLoadError = isLoadingError || (!data && !!error && !isPending);
  const showRefetchErrorBanner = !!error && !!data && !isPending;
  const listHeading =
    activeTab === TournamentTab.Drafts
      ? t("tournaments.tabDrafts")
      : t("tournaments.allTournaments");
  const handleFiltersChange = (next: { when: string; distance: string; clubId?: string }) => {
    setWhenFromValue(next.when);
    setDistanceFromValue(next.distance);
    setClubId(next.clubId);
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-[#f8fbf8] lg:min-h-[calc(100vh-60px)]">
      <div className="mx-auto w-full max-w-[440px] flex-1 px-3 pb-6 pt-6 sm:max-w-none sm:px-4 sm:pb-8 sm:pt-7 lg:max-w-[1060px] lg:px-6 lg:py-8">
        <div className="overflow-hidden rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]">
          <div className="px-4 pb-4 pt-5 sm:px-5 lg:py-4">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <h1 className="text-[21px] font-semibold leading-[1.15] text-[#010a04]">
                {listHeading}
              </h1>
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
                    size="sm"
                    className="h-8 rounded-[8px] bg-brand-primary px-3.5 text-white hover:bg-brand-primary-hover"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <PlusSignIcon size={15} className="text-white" />
                    <span className="text-[14px] font-medium">{t("tournaments.create")}</span>
                  </Button>
                </RoleGuard>
              </div>
            </div>

            <div className="mt-3 lg:hidden">
              <TournamentFilters
                open={filtersOpen && !isDesktop}
                onOpenChange={setFiltersOpen}
                filters={{
                  when: filters.when,
                  distance: filters.distance,
                  clubId: filters.clubId,
                }}
                onFiltersChange={handleFiltersChange}
              />
            </div>

            <div className="hidden flex-col gap-4 lg:flex lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <h1 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">
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
                onFiltersChange={handleFiltersChange}
                onCreate={() => setIsCreateModalOpen(true)}
              />
            </div>
          </div>

          {isFetching && !isPending ? (
            <div className="px-4 pb-2 sm:px-5">
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <InlineLoader size="sm" />
                {t("common.loading")}
              </div>
            </div>
          ) : null}

          {isPending ? (
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
                onClick={() => void refetch()}
              >
                {isFetching ? t("common.loading") : t("tournaments.retry")}
              </Button>
            </div>
          ) : (
            <>
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
                    onClick={() => void refetch()}
                  >
                    {isFetching ? t("common.loading") : t("tournaments.retry")}
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
            </>
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

