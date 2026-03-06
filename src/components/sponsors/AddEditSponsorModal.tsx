import { useState, useEffect } from "react";
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
import { useCreateSponsor, useUpdateSponsor, type ClubSponsor } from "@/hooks/sponsor";
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
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [link, setLink] = useState("");

  const createSponsor = useCreateSponsor(clubId);
  const updateSponsor = useUpdateSponsor(clubId);

  const isEdit = !!editSponsor;

  useEffect(() => {
    if (open) {
      if (editSponsor) {
        setName(editSponsor.name);
        setLogoUrl(editSponsor.logoUrl ?? "");
        setLink(editSponsor.link ?? "");
      } else {
        setName("");
        setLogoUrl("");
        setLink("");
      }
    }
  }, [open, editSponsor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error(t("sponsors.nameRequired"));
      return;
    }

    const payload = {
      name: trimmedName,
      logoUrl: logoUrl.trim(),
      link: link.trim(),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("sponsors.namePlaceholder")}
              className="mt-1.5"
              disabled={!canManage}
            />
          </div>
          <div>
            <Label htmlFor="sponsor-logo">{t("sponsors.logoUrl")}</Label>
            <Input
              id="sponsor-logo"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
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
              value={link}
              onChange={(e) => setLink(e.target.value)}
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
