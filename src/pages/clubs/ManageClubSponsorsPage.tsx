import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CirclePlus, PenLine, Trash2 } from "@/icons/figma-icons";
import { toast } from "sonner";
import { useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/errors";
import { getSafeLink } from "@/lib/url";
import InlineLoader from "@/components/shared/InlineLoader";
import { Button } from "@/components/ui/button";
import { AddEditSponsorModal } from "@/pages/sponsors/components/AddEditSponsorModal";
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
import { useClubPageAccess } from "@/pages/clubs/hooks";
import {
  type ClubSponsor,
  useClubSponsors,
  useDeleteSponsor,
} from "@/pages/sponsors/hooks";

export default function ManageClubSponsorsPage() {
  const { t } = useTranslation();
  const { clubId } = useParams<{ clubId: string }>();
  const hasSuperAdminAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);

  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editSponsor, setEditSponsor] = useState<ClubSponsor | null>(null);
  const [removeSponsor, setRemoveSponsor] = useState<ClubSponsor | null>(null);

  const {
    selectedClub,
    validatedClubId,
    clubsLoading,
    hasAdminClubsError,
    adminClubsError,
  } = useClubPageAccess({
    clubId,
    hasSuperAdminAccess,
  });

  const { data: sponsorsData, isLoading: sponsorsLoading } = useClubSponsors(validatedClubId);
  const deleteSponsor = useDeleteSponsor(validatedClubId);
  const isPageLoading = clubsLoading || sponsorsLoading;

  const sponsors = sponsorsData?.sponsors ?? [];
  const canManageSponsors = sponsorsData?.subscription?.canManageSponsors === true;
  const showPremiumBanner = !isPageLoading && sponsorsData?.subscription?.canManageSponsors === false;

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
    if (!removeSponsor || !validatedClubId) return;

    try {
      await deleteSponsor.mutateAsync(removeSponsor.id);
      toast.success(t("sponsors.removeSuccess"));
      setRemoveSponsor(null);
    } catch (error) {
      toast.error(getErrorMessage(error) ?? t("sponsors.removeError"));
    }
  };

  if (!clubId) return <Navigate to="/clubs/manage" replace />;
  if (hasAdminClubsError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(adminClubsError) ?? t("settings.adminClubsLoadError")}
        </p>
      </div>
    );
  }
  if (!clubsLoading && !hasAdminClubsError && !hasSuperAdminAccess && selectedClub === null) {
    return (
      <Navigate
        to={clubId ? `/clubs/manage?clubId=${clubId}` : "/clubs/manage"}
        replace
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fbf8] px-4 py-6 sm:px-6 md:py-8">
      <div className="mx-auto w-full max-w-[374px] rounded-[12px] border border-black/10 bg-white px-[15px] py-5 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] sm:max-w-[992px] sm:px-0 sm:py-0">
        <div className="flex items-center justify-between sm:px-5 sm:pt-4 sm:pb-[14px]">
          <h1 className="text-xl font-semibold leading-tight text-[#010a04]">
            {t("sponsors.title")}
          </h1>

          <Button
            type="button"
            onClick={handleAddSponsor}
            disabled={sponsorsLoading || !canManageSponsors}
            className="h-[30px] rounded-lg border border-black/[0.12] bg-brand-primary px-3 text-xs font-medium text-white hover:bg-brand-primary-hover"
          >
            <CirclePlus className="mr-1.5 size-3.5" />
            {t("sponsors.newSponsor")}
          </Button>
        </div>

        {showPremiumBanner && (
          <div className="mt-4 rounded-[8px] border border-brand-primary/30 bg-brand-primary/5 px-4 py-3 text-sm text-[#010a04]/80 sm:mx-5 sm:mt-0 sm:mb-4">
            {t("sponsors.premiumRequired")}
          </div>
        )}

        <div className="hidden h-[35px] border-y border-black/10 bg-black/[0.04] sm:block">
          <div className="grid h-full grid-cols-[100px_minmax(180px,1fr)_minmax(220px,1fr)_170px] items-center px-5 text-xs text-[#010a04]/80">
            <span>{t("sponsors.logo")}</span>
            <span>{t("sponsors.name")}</span>
            <span>{t("sponsors.url")}</span>
            <span>{t("sponsors.actions")}</span>
          </div>
        </div>

        {isPageLoading ? (
          <div className="flex justify-center py-16">
            <InlineLoader />
          </div>
        ) : sponsors.length === 0 ? (
          <div className="flex justify-center py-10 text-sm text-[#010a04]/70 sm:px-5">
            {t("sponsors.noSponsors")}
          </div>
        ) : (
          <div className="mt-5 space-y-3 sm:mt-0 sm:space-y-0">
            {sponsors.map((sponsor) => {
              const safeLink = getSafeLink(sponsor.link);

              return (
                <div key={sponsor.id}>
                  <div className="rounded-[10px] bg-black/[0.04] px-[15px] py-[15px] sm:hidden">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#d9d9d9]">
                        {sponsor.logoUrl ? (
                          <img src={sponsor.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-medium text-[#010a04]">{sponsor.name}</div>
                        {safeLink ? (
                          <a
                            href={safeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block truncate text-sm text-[#3083ea] underline"
                          >
                            {safeLink}
                          </a>
                        ) : (
                          <span className="mt-1 block text-sm text-[#010a04]/50">—</span>
                        )}
                      </div>
                    </div>

                    <div className="my-4 border-t border-black/10" />

                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[#d92100] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleRemoveSponsor(sponsor)}
                        disabled={!canManageSponsors}
                      >
                        <Trash2 className="size-4" />
                        {t("sponsors.remove")}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[#067429] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleEditSponsor(sponsor)}
                        disabled={!canManageSponsors}
                      >
                        <PenLine className="size-4" />
                        {t("sponsors.edit")}
                      </button>
                    </div>
                  </div>

                  <div className="hidden h-[45px] grid-cols-[100px_minmax(180px,1fr)_minmax(220px,1fr)_170px] items-center border-b border-black/10 px-5 text-sm text-[#010a04] sm:grid">
                    <div className="flex items-center">
                      <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#d9d9d9]">
                        {sponsor.logoUrl ? (
                          <img src={sponsor.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </div>

                    <div className="truncate pr-4">{sponsor.name}</div>

                    <div className="truncate pr-4">
                      {safeLink ? (
                        <a
                          href={safeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3083ea] underline"
                        >
                          {safeLink}
                        </a>
                      ) : (
                        <span className="text-[#010a04]/50">—</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[#067429] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleEditSponsor(sponsor)}
                        disabled={!canManageSponsors}
                      >
                        <PenLine className="size-3.5" />
                        {t("sponsors.edit")}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[#d92100] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => handleRemoveSponsor(sponsor)}
                        disabled={!canManageSponsors}
                      >
                        <Trash2 className="size-3.5" />
                        {t("sponsors.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddEditSponsorModal
        open={addEditModalOpen}
        onOpenChange={setAddEditModalOpen}
        clubId={validatedClubId}
        editSponsor={editSponsor}
        canManage={canManageSponsors}
      />

      <AlertDialog open={!!removeSponsor} onOpenChange={(open) => !open && setRemoveSponsor(null)}>
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
