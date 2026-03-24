import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import { CreateTournamentModal } from "@/pages/tournaments/components/CreateTournamentModal";
import { useAuth, useIsOrganiserOrAbove } from "@/pages/auth/hooks";
import { TournamentActions } from "@/pages/tournaments/components/TournamentActions";
import { TournamentTable } from "@/pages/tournaments/components/TournamentTable";
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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-brand-primary/[0.03]">
      <div className="mx-auto w-full max-w-[1060px] flex-1 px-4 py-8 sm:px-6">
        <div className="overflow-hidden rounded-[12px] border border-black/10 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5">
            <h1 className="text-xl font-semibold leading-tight text-foreground">
              {t("tournaments.allTournaments")}
            </h1>
            <TournamentActions
              filtersOpen={filtersOpen}
              onFiltersOpenChange={setFiltersOpen}
              status={filters.status}
              canShowStatusFilter={canShowStatusFilter}
              onStatusChange={setStatusFromValue}
              onCreate={openCreateModal}
            />
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
