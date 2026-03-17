import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  ArrowLeft01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { useAdminClubs } from "@/pages/clubs/hooks";
import { useClubSponsors, useDeleteSponsor } from "@/pages/sponsors/hooks";
import { useAuth, useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SponsorRow } from "@/pages/sponsors/components/SponsorRow";
import { AddEditSponsorModal } from "@/pages/sponsors/components/AddEditSponsorModal";
import InlineLoader from "@/components/shared/InlineLoader";
import type { ClubSponsor } from "@/pages/sponsors/hooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SponsorsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasAccess = useHasRoleOrAbove(ROLES.CLUB_ADMIN);
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const { data: adminClubsData, isLoading: clubsLoading } = useAdminClubs(hasAccess);

  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editSponsor, setEditSponsor] = useState<ClubSponsor | null>(null);
  const [removeSponsor, setRemoveSponsor] = useState<ClubSponsor | null>(null);
  const [mobileView, setMobileView] = useState<"clubs" | "sponsors">("clubs");

  const clubs = adminClubsData?.clubs ?? [];
  const selectedClub = clubs.find((c) => c.id === selectedClubId) ?? null;
  const effectiveClubId = selectedClub?.id ?? selectedClubId;

  const { data: sponsorsData, isLoading: sponsorsLoading } =
    useClubSponsors(effectiveClubId);
  const deleteSponsor = useDeleteSponsor(effectiveClubId);

  const sponsors = sponsorsData?.sponsors ?? [];
  const canManageSponsors = sponsorsData?.subscription?.canManageSponsors;
  const showPremiumBanner =
    !sponsorsLoading && canManageSponsors === false;

  const handleAddSponsor = () => {
    setEditSponsor(null);
    setAddEditModalOpen(true);
  };

  const handleEditSponsor = (sponsor: ClubSponsor) => {
    setEditSponsor(sponsor);
    setAddEditModalOpen(true);
  };

  const handleRemoveSponsor = (sponsor: ClubSponsor) => {
    setRemoveSponsor(sponsor);
  };

  const confirmRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!removeSponsor || !effectiveClubId) return;
    try {
      await deleteSponsor.mutateAsync(removeSponsor.id);
      toast.success(t("sponsors.removeSuccess"));
      setRemoveSponsor(null);
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;
      toast.error(msg ?? t("sponsors.removeError"));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <InlineLoader />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-gray-50">
      <div className="flex w-full max-w-6xl flex-col lg:flex-row">
        {/* Sidebar - club selector */}
        <aside
          className={cn(
            "w-full border-b border-border bg-muted/30 p-4 lg:w-80 lg:border-b-0 lg:border-r",
            mobileView === "sponsors" && "hidden lg:block"
          )}
        >
          <Link
            to="/sponsors"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            {t("sponsors.backToAllSponsors")}
          </Link>
          <h2 className="text-lg font-semibold text-foreground">
            {t("sponsors.allClubs")}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("sponsors.selectClub")}
          </p>

          {clubsLoading ? (
            <div className="flex justify-center py-8">
              <InlineLoader />
            </div>
          ) : clubs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("manageClub.noClubs")}
            </p>
          ) : (
            <div className="space-y-2">
              {clubs.map((club) => {
                const isSelected = club.id === effectiveClubId;
                return (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => {
                      setSelectedClubId(club.id);
                      setMobileView("sponsors");
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                      isSelected
                        ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full",
                        isSelected ? "bg-brand-primary" : "bg-muted-foreground/40"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {club.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main
          className={cn(
            "flex-1 p-4 lg:p-6",
            mobileView === "clubs" && "hidden lg:block"
          )}
        >
          {!effectiveClubId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">
                {t("sponsors.selectClubToManage")}
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 -ml-2 lg:hidden"
                onClick={() => setMobileView("clubs")}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-1" />
                {t("manageClub.backToClubs")}
              </Button>

              {/* Club Sponsors card */}
              <div className="rounded-lg border-2 border-blue-500/50 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <h1 className="text-xl font-semibold text-foreground">
                    {t("sponsors.title")}
                  </h1>
                  <Button
                    className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
                    onClick={handleAddSponsor}
                    disabled={sponsorsLoading || canManageSponsors !== true}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
                    {t("sponsors.newSponsor")}
                  </Button>
                </div>

                {showPremiumBanner && (
                  <div className="mx-6 mb-4 flex items-center gap-3 rounded-lg border border-brand-primary/30 bg-brand-primary/5 px-4 py-3 dark:border-brand-primary/40 dark:bg-brand-primary/10">
                    <HugeiconsIcon
                      icon={SparklesIcon}
                      size={20}
                      className="shrink-0 text-brand-primary"
                    />
                    <p className="text-sm text-muted-foreground">
                      {t("sponsors.premiumRequired")}
                    </p>
                    <Button
                      size="sm"
                      className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
                      onClick={() => navigate("/upgrade")}
                    >
                      {t("manageClub.upgradeToPremium")}
                    </Button>
                  </div>
                )}

                {sponsorsLoading ? (
                  <div className="flex justify-center py-12">
                    <InlineLoader />
                  </div>
                ) : sponsors.length === 0 ? (
                  <div className="rounded-b-lg border-t-0 border-border bg-muted/20 px-6 py-12 text-center">
                    <p className="text-muted-foreground">{t("sponsors.noSponsors")}</p>
                    {canManageSponsors && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={handleAddSponsor}
                      >
                        <HugeiconsIcon icon={PlusSignIcon} size={16} className="mr-2" />
                        {t("sponsors.newSponsor")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t("sponsors.logo")}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t("sponsors.name")}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t("sponsors.url")}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t("sponsors.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sponsors.map((sponsor) => (
                          <SponsorRow
                            key={sponsor.id}
                            sponsor={sponsor}
                            canManage={canManageSponsors === true}
                            onEdit={handleEditSponsor}
                            onRemove={handleRemoveSponsor}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <AddEditSponsorModal
        open={addEditModalOpen}
        onOpenChange={setAddEditModalOpen}
        clubId={effectiveClubId ?? ""}
        editSponsor={editSponsor}
        canManage={canManageSponsors === true}
      />

      <AlertDialog
        open={!!removeSponsor}
        onOpenChange={(open) => !open && setRemoveSponsor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sponsors.removeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sponsors.removeConfirmDescription", {
                name: removeSponsor?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("sponsors.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => confirmRemove(e)}
              disabled={deleteSponsor.isPending}
            >
              {deleteSponsor.isPending ? t("common.loading") : t("sponsors.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
