import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SponsorLogoUploadZone } from "@/components/shared/SponsorLogoUploadZone";
import { useCreateSponsor, useUpdateSponsor, type ClubSponsor } from "@/pages/sponsors/hooks";
import { toast } from "sonner";

interface AddEditSponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string | null;
  editSponsor: ClubSponsor | null;
  canManage: boolean;
}

export function AddEditSponsorModal({
  open,
  onOpenChange,
  clubId,
  editSponsor,
  canManage,
}: AddEditSponsorModalProps) {
  const { t } = useTranslation();
  const initialForm = {
    name: editSponsor?.name ?? "",
    logoUrl: editSponsor?.logoUrl ?? "",
    link: editSponsor?.link ?? "",
  };
  const [form, setForm] = useState<{
    name: string;
    logoUrl: string;
    link: string;
  } | null>(null);

  const createSponsor = useCreateSponsor(clubId);
  const updateSponsor = useUpdateSponsor(clubId);

  const isEdit = !!editSponsor;
  const currentForm = form ?? initialForm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !clubId) return;

    const trimmedName = currentForm.name.trim();
    if (!trimmedName) {
      toast.error(t("sponsors.nameRequired"));
      return;
    }

    const payload = {
      name: trimmedName,
      logoUrl: currentForm.logoUrl.trim(),
      link: currentForm.link.trim(),
    };

    try {
      if (isEdit) {
        await updateSponsor.mutateAsync({
          sponsorId: editSponsor.id,
          input: payload,
        });
        toast.success(t("sponsors.updateSuccess"));
      } else {
        await createSponsor.mutateAsync(payload);
        toast.success(t("sponsors.createSuccess"));
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;
      toast.error(msg ?? (isEdit ? t("sponsors.updateError") : t("sponsors.createError")));
    }
  };

  const isPending = createSponsor.isPending || updateSponsor.isPending;
  const canSubmit = canManage && !!clubId;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setForm(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("sponsors.editTitle") : t("sponsors.addTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SponsorLogoUploadZone
            logoUrl={currentForm.logoUrl}
            onLogoUrlChange={(nextUrl) =>
              setForm((prev) => ({ ...(prev ?? initialForm), logoUrl: nextUrl }))
            }
            disabled={!canManage || isPending}
            label={t("sponsors.logoUploadLabel")}
            hint={t("sponsors.logoUploadHint")}
          />

          <div>
            <Label htmlFor="sponsor-name" className="text-[10px] font-medium uppercase text-[#010a04]/70">
              {t("sponsors.nameLabel")}
            </Label>
            <Input
              id="sponsor-name"
              value={currentForm.name}
              onChange={(e) =>
                setForm((prev) => ({ ...(prev ?? initialForm), name: e.target.value }))
              }
              placeholder={t("sponsors.namePlaceholder")}
              className="mt-1.5"
              disabled={!canManage}
            />
          </div>

          <div>
            <Label htmlFor="sponsor-link" className="text-[10px] font-medium uppercase text-[#010a04]/70">
              {t("sponsors.urlLabel")}
            </Label>
            <Input
              id="sponsor-link"
              type="url"
              value={currentForm.link}
              onChange={(e) =>
                setForm((prev) => ({ ...(prev ?? initialForm), link: e.target.value }))
              }
              placeholder={t("sponsors.linkPlaceholder")}
              className="mt-1.5"
              disabled={!canManage}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary-hover"
            disabled={!canSubmit || isPending}
          >
            {isPending ? t("common.loading") : isEdit ? t("sponsors.save") : t("sponsors.create")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
