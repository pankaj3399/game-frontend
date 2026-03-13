import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CreateTournamentModal } from "@/components/tournaments/CreateTournamentModal";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Settings01Icon, Upload01Icon, ViewIcon, PencilIcon } from "@hugeicons/core-free-icons";
import { useTournamentsSuspense, useAdminClubsSuspense, usePublishTournament } from "@/hooks";
import { useAuth, useIsOrganiserOrAbove } from "@/hooks/auth";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ROLES } from "@/constants/roles";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";

export default function TournamentListPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isProfileComplete } = useAuth();
  const isOrganiserOrAbove = useIsOrganiserOrAbove();
  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");
  const [filters, setFilters] = useState<{
    status?: string;
    clubId?: string;
    page: number;
    limit: number;
    q?: string;
    view?: "published" | "drafts";
  }>({ page: 1, limit: 10, view: "published" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);

  const effectiveFilters = {
    ...filters,
    view: isOrganiserOrAbove
      ? (activeTab === "drafts" ? ("drafts" as const) : ("published" as const))
      : undefined,
  };

  const { data } = useTournamentsSuspense(effectiveFilters);
  const { data: adminClubsData } = useAdminClubsSuspense();
  const publishTournament = usePublishTournament();
  const clubs = adminClubsData?.clubs ?? [];

  const tournaments = data?.tournaments ?? [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };

  const formatDate = (d: string | null) => {
    if (!d) return t("tournaments.unscheduled");
    try {
      const parsed = typeof d === "string" ? parseISO(d) : new Date(d);
      return isValid(parsed) ? format(parsed, "d MMM, yyyy") : t("tournaments.unscheduled");
    } catch {
      return t("tournaments.unscheduled");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishTournament.mutateAsync({ id, data: {} });
      toast.success(t("tournaments.published"));
      setActiveTab("published");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg ?? t("tournaments.publishError"));
    }
  };



  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;

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
            {isOrganiserOrAbove && (
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => {
                    setActiveTab(v as "published" | "drafts");
                    setFilters((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  <TabsList variant="line" className="h-9">
                    <TabsTrigger value="published">{t("tournaments.tabPublished")}</TabsTrigger>
                    <TabsTrigger value="drafts">{t("tournaments.tabDrafts")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <HugeiconsIcon icon={Settings01Icon} size={16} className="mr-2" />
                    {t("tournaments.filters")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-4">
                  <div className="space-y-4">
                    {(!isOrganiserOrAbove || activeTab === "published") && (
                      <div>
                        <label className="mb-2 block text-xs font-medium text-muted-foreground">
                          {t("tournaments.filterStatus")}
                        </label>
                        <Select
                          value={filters.status ?? "all"}
                          onValueChange={(v) =>
                            setFilters((prev) => ({
                              ...prev,
                              status: v === "all" ? undefined : v,
                              page: 1,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("tournaments.allStatuses")}</SelectItem>
                            <SelectItem value="active">{t("tournaments.statusActive")}</SelectItem>
                            <SelectItem value="inactive">{t("tournaments.statusInactive")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {isOrganiserOrAbove && (
                      <div>
                        <label className="mb-2 block text-xs font-medium text-muted-foreground">
                          {t("tournaments.filterClub")}
                        </label>
                        <Select
                          value={filters.clubId ?? "all"}
                          onValueChange={(v) =>
                            setFilters((prev) => ({
                              ...prev,
                              clubId: v === "all" ? undefined : v,
                              page: 1,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("tournaments.allClubs")}</SelectItem>
                            {clubs.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setFiltersOpen(false)}
                    >
                      {t("tournaments.applyFilters")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <RoleGuard requireRoleOrAbove={ROLES.ORGANISER}>
                <Button
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
                  {t("tournaments.create")}
                </Button>
              </RoleGuard>
            </div>
          </div>

          {tournaments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground">
                {isOrganiserOrAbove && activeTab === "drafts"
                  ? t("tournaments.noDrafts")
                  : t("tournaments.noTournaments")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-12">
                      #
                    </th>
                    <th className="w-[32%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("tournaments.tournamentName")}
                    </th>
                    <th className="w-[26%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("tournaments.club")}
                    </th>
                    <th className="w-[18%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("tournaments.date")}
                    </th>
                    <th className="w-[24%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("tournaments.action")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((tournament, idx) => (
                    <tr
                      key={tournament.id}
                      className="border-b border-border bg-card transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                    
                          <span className="font-medium text-foreground">{tournament.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {tournament.club?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(tournament.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/tournaments/${tournament.id}`}>
                              <HugeiconsIcon icon={ViewIcon} size={16} className="mr-1" />
                              {t("tournaments.view")}
                            </Link>
                          </Button>
                          {isOrganiserOrAbove &&
                            activeTab === "drafts" &&
                            tournament.status === "draft" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingTournamentId(tournament.id)}
                              >
                                <HugeiconsIcon icon={PencilIcon} size={16} className="mr-1" />
                                {t("tournaments.edit")}
                              </Button>
                            )}
                          {isOrganiserOrAbove &&
                            activeTab === "drafts" &&
                            tournament.status === "draft" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublish(tournament.id)}
                                disabled={publishTournament.isPending}
                              >
                                <HugeiconsIcon icon={Upload01Icon} size={16} className="mr-1" />
                                {t("tournaments.publish")}
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-muted-foreground">
                {t("tournaments.paginationInfo", {
                  from: (pagination.page - 1) * pagination.limit + 1,
                  to: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                >
                  {t("tournaments.prev")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.min(pagination.totalPages, prev.page + 1),
                    }))
                  }
                >
                  {t("tournaments.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateTournamentModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      <CreateTournamentModal
        open={Boolean(editingTournamentId)}
        onOpenChange={(open) => {
          if (!open) setEditingTournamentId(null);
        }}
        mode="edit"
        tournamentId={editingTournamentId}
      />
    </div>
  );
}
