import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import InlineLoader from "@/components/shared/InlineLoader";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { CreateTournamentModal } from "@/pages/tournaments/components/CreateTournamentModal";
import { useAuth, useIsOrganiserOrAbove } from "@/pages/auth/hooks";
import { TournamentActions } from "@/pages/tournaments/components/TournamentActions";
import { TournamentTable } from "@/pages/tournaments/components/TournamentTable";
import { useTournamentActions } from "@/pages/tournaments/hooks/useTournamentActions";
import { useTournamentFilters } from "@/pages/tournaments/hooks/useTournamentFilters";
import { useTournamentPermissions } from "@/pages/tournaments/hooks/useTournamentPermissions";
import { useTournaments } from "@/pages/tournaments/hooks/tournament";

export default function TournamentListPage() {
  const { isAuthenticated, isProfileComplete } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;

  return <TournamentListContent />;
}

function TournamentListContent() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isOrganiserOrAbove = useIsOrganiserOrAbove();
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
  } = useTournamentFilters({ isOrganiserOrAbove, userId: user?.id ?? null });
  const { modal, openCreateModal, closeModal } = useTournamentActions();
  const { isDraftTab } = useTournamentPermissions({
    activeTab,
    isOrganiserOrAbove,
  });

  const { data, isPending, isFetching } = useTournaments(effectiveFilters());

  const tournaments = data?.tournaments ?? [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-brand-primary/[0.03]">
      <div className="mx-auto w-full max-w-[1060px] flex-1 px-4 py-8 sm:px-6">
        <div className="overflow-y-hidden overflow-x-auto rounded-[12px] border border-black/10 bg-white shadow-sm">
          <div className="px-4 py-3 sm:px-5 sm:py-3.5">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold leading-tight text-foreground">
                {activeTab === "drafts" ? t("tournaments.tabDrafts") : t("tournaments.allTournaments")}
              </h1>
              <TournamentActions
                activeTab={activeTab}
                onTabChange={setTab}
                filtersOpen={filtersOpen}
                onFiltersOpenChange={setFiltersOpen}
                query={filters.q ?? ""}
                status={filters.status}
                when={filters.when}
                distance={filters.distance}
                clubId={filters.clubId}
                onWhenChange={setWhenFromValue}
                onDistanceChange={setDistanceFromValue}
                onClubChange={setClubId}
                onCreate={openCreateModal}
              />
            </div>
          </div>

          {isPending ? (
            <TournamentTableSkeleton />
          ) : tournaments.length === 0 ? (
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
        open={Boolean(modal)}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        mode="create"
        tournamentId={null}
      />
    </div>
  );
}

function TournamentTableSkeleton() {
  const rows = Array.from({ length: 8 }, (_, index) => index);

  return (
    <div className="border-y border-black/10">
      <div className="h-[35px] bg-black/5" />
      <div className="px-4 py-2">
        {rows.map((row) => (
          <div key={row} className="flex h-[45px] items-center gap-3 border-b border-black/5 last:border-b-0">
            <div className="h-3 w-5 animate-pulse rounded bg-black/10" />
            <div className="h-3 w-[38%] animate-pulse rounded bg-black/10" />
            <div className="h-3 w-[30%] animate-pulse rounded bg-black/10" />
            <div className="h-3 w-[16%] animate-pulse rounded bg-black/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
