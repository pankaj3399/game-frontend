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
import { useCreateSponsor, useUpdateSponsor, type ClubSponsor } from "@/pages/sponsors/hooks";
import { toast } from "sonner";

interface AddEditSponsorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
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
    description: editSponsor?.description ?? "",
    logoUrl: editSponsor?.logoUrl ?? "",
    link: editSponsor?.link ?? "",
  };
  const [form, setForm] = useState<{
    name: string;
    description: string;
    logoUrl: string;
    link: string;
  } | null>(null);

  const createSponsor = useCreateSponsor(clubId);
  const updateSponsor = useUpdateSponsor(clubId);

  const isEdit = !!editSponsor;
  const currentForm = form ?? initialForm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const trimmedName = currentForm.name.trim();
    if (!trimmedName) {
      toast.error(t("sponsors.nameRequired"));
      return;
    }

    const payload = {
      name: trimmedName,
      description: currentForm.description.trim() || undefined,
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
            {isEdit ? t("sponsors.editTitle") : t("sponsors.newSponsor")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sponsor-name">{t("sponsors.name")}</Label>
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
            <Label htmlFor="sponsor-description">{t("sponsors.description")}</Label>
            <textarea
              id="sponsor-description"
              value={currentForm.description}
              onChange={(e) =>
                setForm((prev) => ({ ...(prev ?? initialForm), description: e.target.value }))
              }
              placeholder={t("sponsors.descriptionPlaceholder")}
              rows={3}
              className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canManage}
            />
          </div>
          <div>
            <Label htmlFor="sponsor-logo">{t("sponsors.logoUrl")}</Label>
            <Input
              id="sponsor-logo"
              type="url"
              value={currentForm.logoUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...(prev ?? initialForm), logoUrl: e.target.value }))
              }
              placeholder={t("sponsors.logoUrlPlaceholder")}
              className="mt-1.5"
              disabled={!canManage}
            />
          </div>
          <div>
            <Label htmlFor="sponsor-link">{t("sponsors.link")}</Label>
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
            disabled={!canManage || isPending}
          >
            {isPending ? t("common.loading") : isEdit ? t("sponsors.save") : t("sponsors.add")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
