import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CirclePlus, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/errors";
import { getSafeLink } from "@/lib/url";
import InlineLoader from "@/components/shared/InlineLoader";
import { Button } from "@/components/ui/button";
import { PlatformSponsorFormDialog } from "@/pages/admin/components/PlatformSponsorFormDialog";
import { PlatformSponsorRemoveDialog } from "@/pages/admin/components/PlatformSponsorRemoveDialog";
import {
  useCreatePlatformSponsor,
  useDeletePlatformSponsor,
  usePlatformSponsors,
  useUpdatePlatformSponsor,
  type PlatformSponsor,
  type UpsertPlatformSponsorInput,
} from "@/pages/admin/hooks";
import { RenderLogo } from "@/components/shared/RenderLogo";
export default function AdminPlatformSponsorsPage() {
  const { t } = useTranslation();
  const hasAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);
  const { isAuthenticated, isProfileComplete, loading } = useAuth();

  const { data, isLoading } = usePlatformSponsors(hasAccess);
  const createSponsor = useCreatePlatformSponsor();
  const updateSponsor = useUpdatePlatformSponsor();
  const deleteSponsor = useDeletePlatformSponsor();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<PlatformSponsor | null>(null);
  const [removingSponsor, setRemovingSponsor] = useState<PlatformSponsor | null>(null);

  const isSaving = createSponsor.isPending || updateSponsor.isPending;
  const sponsors = data?.sponsors ?? [];

  

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <InlineLoader />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;
  if (!hasAccess) return <Navigate to="/profile" replace />;

  const openCreateDialog = () => {
    setEditingSponsor(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (sponsor: PlatformSponsor) => {
    setEditingSponsor(sponsor);
    setIsDialogOpen(true);
  };

  const handleSave = async (payload: UpsertPlatformSponsorInput) => {
    try {
      if (editingSponsor) {
        await updateSponsor.mutateAsync({ sponsorId: editingSponsor.id, input: payload });
        toast.success(t("admin.platformSponsors.toastUpdated"));
      } else {
        await createSponsor.mutateAsync(payload);
        toast.success(t("admin.platformSponsors.toastAdded"));
      }

      setIsDialogOpen(false);
      setEditingSponsor(null);
    } catch (error) {
      toast.error(getErrorMessage(error) ?? t("admin.platformSponsors.toastErrorGeneric"));
    }
  };

  const handleRemove = async () => {
    if (!removingSponsor) return;

    try {
      await deleteSponsor.mutateAsync(removingSponsor.id);
      toast.success(t("admin.platformSponsors.toastRemoved"));
      setRemovingSponsor(null);
    } catch (error) {
      toast.error(getErrorMessage(error) ?? t("admin.platformSponsors.toastErrorGeneric"));
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fbf8] px-4 py-6 sm:px-6 md:py-8">
      <div className="mx-auto w-full max-w-[992px] rounded-xl border border-black/10 bg-white shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between px-4 pt-5 pb-3 sm:px-5 md:pt-4 md:pb-2">
          <h1 className="text-xl font-semibold leading-tight text-[#010a04]">
            <span className="">{t("admin.platformSponsors.pageTitle")}</span>
          </h1>

          <Button
            type="button"
            onClick={openCreateDialog}
            disabled={isLoading}
            className="h-8 rounded-lg border border-black/[0.12] bg-brand-primary px-3 text-xs font-medium text-white hover:bg-brand-primary-hover sm:px-4 md:border-0 md:text-sm"
          >
            <CirclePlus className="mr-1.5 size-3.5" />
            {t("admin.platformSponsors.newSponsor")}
          </Button>
        </div>

        <div className="hidden md:block">
          <div className="h-9 border-y border-black/10 bg-black/[0.04]">
            <div className="grid h-full grid-cols-[92px_1fr_1fr_188px] items-center px-4 text-xs text-[#010a04]/80 md:px-5">
              <span>{t("admin.platformSponsors.columnLogo")}</span>
              <span>{t("admin.platformSponsors.columnName")}</span>
              <span>{t("admin.platformSponsors.columnUrl")}</span>
              <span>{t("admin.platformSponsors.columnActions")}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <InlineLoader />
            </div>
          ) : sponsors.length === 0 ? (
            <div className="flex justify-center px-5 py-10 text-sm text-[#010a04]/70">
              {t("admin.platformSponsors.empty")}
            </div>
          ) : (
            <div>
              {sponsors.map((sponsor) => {
                const safeLink = getSafeLink(sponsor.link);

                return (
                  <div
                    key={sponsor.id}
                    className="grid h-11 grid-cols-[92px_1fr_1fr_188px] items-center border-b border-black/10 px-4 text-sm text-[#010a04] md:px-5"
                  >
                    <div className="flex items-center">{RenderLogo(sponsor.logoUrl, "size-6")}</div>

                    <span className="truncate pr-3">{sponsor.name}</span>

                    {safeLink ? (
                      <a
                        href={safeLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="truncate pr-3 text-sm font-medium text-[#3083ea] underline"
                      >
                        {safeLink}
                      </a>
                    ) : (
                      <span className="text-[#010a04]/50">—</span>
                    )}

                    <div className="flex items-center gap-5 text-[12px]">
                      <button
                        type="button"
                        className="inline-flex items-center gap-[5px] text-brand-primary"
                        onClick={() => openEditDialog(sponsor)}
                      >
                        <PenLine className="size-4" />
                        {t("admin.platformSponsors.edit")}
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center gap-[5px] text-[#d92100]"
                        onClick={() => setRemovingSponsor(sponsor)}
                        disabled={deleteSponsor.isPending}
                      >
                        <Trash2 className="size-4" />
                        {t("admin.platformSponsors.remove")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 pt-3 md:hidden">
          {isLoading ? (
            <div className="flex justify-center py-14">
              <InlineLoader />
            </div>
          ) : sponsors.length === 0 ? (
            <div className="flex justify-center py-8 text-sm text-[#010a04]/70">{t("admin.platformSponsors.empty")}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {sponsors.map((sponsor) => {
                const safeLink = getSafeLink(sponsor.link);

                return (
                  <div
                    key={sponsor.id}
                    className="rounded-lg bg-black/[0.04] px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      {RenderLogo(sponsor.logoUrl, "size-10")}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium text-[#010a04]">{sponsor.name}</p>
                        {safeLink ? (
                          <a
                            href={safeLink}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="block truncate text-sm text-[#3083ea] underline"
                          >
                            {safeLink}
                          </a>
                        ) : (
                          <span className="text-sm text-[#010a04]/50">—</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-black/10 pt-4">
                      <div className="flex items-center justify-between text-xs">
                        <Button
                          className="inline-flex items-center gap-[5px] text-[#d92100]"
                          onClick={() => setRemovingSponsor(sponsor)}
                          disabled={deleteSponsor.isPending}
                        >
                          <Trash2 className="size-4" />
                          {t("admin.platformSponsors.remove")}
                        </Button>

                        <Button
                          disabled={deleteSponsor.isPending}
                          className="inline-flex items-center gap-[5px] text-brand-primary"
                          onClick={() => openEditDialog(sponsor)}
                        >
                          <PenLine className="size-4" />
                          {t("admin.platformSponsors.edit")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PlatformSponsorFormDialog
        open={isDialogOpen}
        editingSponsor={editingSponsor}
        isSaving={isSaving}
        onOpenChange={(open: boolean) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingSponsor(null);
          }
        }}
        onSave={handleSave}
      />

      <PlatformSponsorRemoveDialog
        open={!!removingSponsor}
        sponsorName={removingSponsor?.name ?? null}
        isRemoving={deleteSponsor.isPending}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setRemovingSponsor(null);
          }
        }}
        onConfirm={() => void handleRemove()}
      />
    </div>
  );
}
