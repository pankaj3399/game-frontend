import { useState } from "react";
import { useTranslation } from "react-i18next";
import InlineLoader from "@/components/shared/InlineLoader";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { CreateTournamentModal } from "@/pages/tournaments/components/CreateTournamentModal";
import {  useIsOrganiserOrAbove } from "@/pages/auth/hooks";
import { TournamentActions } from "@/pages/tournaments/components/TournamentActions";
import { TournamentTable } from "@/pages/tournaments/components/TournamentTable";
import { useTournamentFilters } from "@/pages/tournaments/hooks/useTournamentFilters";
import { useTournamentPermissions } from "@/pages/tournaments/hooks/useTournamentPermissions";
import { useTournaments } from "./hooks/useTournaments";
import { useAuth } from "@/pages/auth/hooks";
import { TournamentTableSkeleton } from "@/components/ui/tournament-table-skeleton";

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
  const {user} = useAuth();
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
  } = useTournamentFilters({ isOrganiserOrAbove, userId: user?.id ?? undefined });
  const { isDraftTab } = useTournamentPermissions({
    activeTab,
    isOrganiserOrAbove,
  });

  const { data, isPending, isFetching } = useTournaments(effectiveFilters());

  const tournaments = data?.tournaments ?? [];
  const pagination = data?.pagination ?? DEFAULT_PAGINATION;
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
                {activeTab === TournamentTab.Drafts ? t("tournaments.allTournaments") : t("tournaments.tabDrafts")}
              </h1>
              <TournamentActions
                activeTab={activeTab}
                onTabChange={setTab}
                filtersOpen={filtersOpen}
                onFiltersOpenChange={setFiltersOpen}
                query={filters.q ?? ""}
                when={filters.when}
                distance={filters.distance}
                clubId={filters.clubId}
                onFiltersChange={handleFiltersChange}
                onCreate={() => setIsCreateModalOpen(true)}
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
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
        tournamentId={null}
      />
    </div>
  );
}

