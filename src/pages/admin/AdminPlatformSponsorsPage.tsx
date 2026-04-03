import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CirclePlus } from "@/icons/figma-icons";
import { toast } from "sonner";
import { useAuth, useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { getErrorMessage } from "@/lib/errors";
import InlineLoader from "@/components/shared/InlineLoader";
import { Button } from "@/components/ui/button";
import { PlatformSponsorFormDialog } from "@/pages/admin/components/PlatformSponsorFormDialog";
import { PlatformSponsorRemoveDialog } from "@/pages/admin/components/PlatformSponsorRemoveDialog";
import { SponsorItem } from "@/pages/admin/components/SponsorItem";
import {
  useCreatePlatformSponsor,
  useDeletePlatformSponsor,
  usePlatformSponsors,
  useUpdatePlatformSponsor,
  type PlatformSponsor,
  type UpsertPlatformSponsorInput,
} from "@/pages/admin/hooks";
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#f4f7f6] px-4 py-6 sm:px-6 md:py-8">
      <div className="mx-auto w-full max-w-[992px] rounded-[15px] border border-black/10 bg-white shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between px-5 pt-4 pb-[14px]">
          <h1 className="text-xl font-semibold leading-tight text-[#010a04]">
            <span className="">{t("admin.platformSponsors.pageTitle")}</span>
          </h1>

          <Button
            type="button"
            onClick={openCreateDialog}
            disabled={isLoading}
            className="h-[30px] rounded-lg border border-black/[0.12] bg-[#006B2E] px-3 text-xs font-medium text-white hover:bg-[#005a26]"
          >
            <CirclePlus className="mr-1.5 size-3.5 text-white" />
            {t("admin.platformSponsors.newSponsor")}
          </Button>
        </div>

        <div className="hidden md:block">
          <div className="h-[35px] border-y border-black/10 bg-[#f0f0f0]">
            <div className="grid h-full grid-cols-[100px_minmax(180px,1fr)_minmax(220px,1fr)_170px] items-center px-5 text-xs text-[#010a04]/80">
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
              {sponsors.map((s) => (
                <SponsorItem
                  key={s.id}
                  sponsor={s}
                  variant="desktop"
                  onEdit={() => openEditDialog(s)}
                  onRemove={() => setRemovingSponsor(s)}
                  isDeleting={deleteSponsor.isPending}
                />
              ))}
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
              {sponsors.map((s) => (
                <SponsorItem
                  key={s.id}
                  sponsor={s}
                  variant="mobile"
                  onEdit={() => openEditDialog(s)}
                  onRemove={() => setRemovingSponsor(s)}
                  isDeleting={deleteSponsor.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PlatformSponsorFormDialog
        open={isDialogOpen}
        editingSponsor={editingSponsor}
        isSaving={isSaving}
        onOpenChange={(open: boolean) => {
          if (!open && isSaving) return;
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
