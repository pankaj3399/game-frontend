import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { CreateTournamentModal } from "@/pages/tournaments/components/CreateTournamentModal";
import { useAuth, useIsOrganiserOrAbove } from "@/pages/auth/hooks";
import { TournamentActions } from "@/pages/tournaments/components/TournamentActions";
import { TournamentTable } from "@/pages/tournaments/components/TournamentTable";
import { TournamentTabs } from "@/pages/tournaments/components/TournamentTabs";
import { useTournamentActions } from "@/pages/tournaments/hooks/useTournamentActions";
import { useTournamentFilters } from "@/pages/tournaments/hooks/useTournamentFilters";
import { useTournamentPermissions } from "@/pages/tournaments/hooks/useTournamentPermissions";
import { useTournamentsSuspense } from "@/pages/tournaments/hooks/tournament";

export default function TournamentListPage() {
  const { isAuthenticated, isProfileComplete } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;

  return <TournamentListContent />;
}

function TournamentListContent() {
  const { t, i18n } = useTranslation();
  const isOrganiserOrAbove = useIsOrganiserOrAbove();
  const {
    activeTab,
    filters,
    effectiveFilters,
    filtersOpen,
    setFiltersOpen,
    setTab,
    setStatusFromValue,
    setQuery,
    setPage,
  } = useTournamentFilters({ isOrganiserOrAbove });
  const {
    modal,
    openCreateModal,
    openEditModal,
    closeModal,
    publishDraft,
    isPublishing,
  } = useTournamentActions({ onPublished: () => setTab("published") });
  const { isDraftTab, canShowStatusFilter, getRowPermissions } =
    useTournamentPermissions({
      activeTab,
      isOrganiserOrAbove,
    });

  const { data } = useTournamentsSuspense(effectiveFilters());

  const tournaments = data?.tournaments ?? [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  const isEditModal = modal?.type === "edit";
  const editTournamentId = isEditModal ? modal.id : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-gray-50">
      <div className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h1 className="text-xl font-semibold text-foreground">
                {t("tournaments.allTournaments")}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <TournamentTabs
                visible={isOrganiserOrAbove}
                activeTab={activeTab}
                onTabChange={setTab}
              />
              <TournamentActions
                filtersOpen={filtersOpen}
                onFiltersOpenChange={setFiltersOpen}
                query={filters.q ?? ""}
                status={filters.status}
                canShowStatusFilter={canShowStatusFilter}
                onQueryChange={setQuery}
                onStatusChange={setStatusFromValue}
                onCreate={openCreateModal}
              />
            </div>
          </div>

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
              getRowPermissions={getRowPermissions}
              onEdit={openEditModal}
              onPublish={publishDraft}
              isPublishing={isPublishing}
            />
          )}

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
        mode={isEditModal ? "edit" : "create"}
        tournamentId={editTournamentId}
      />
    </div>
  );
}
