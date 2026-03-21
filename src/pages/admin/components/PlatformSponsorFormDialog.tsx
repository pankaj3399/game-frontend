import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { PlatformSponsor, UpsertPlatformSponsorInput } from "@/pages/admin/hooks";
import { PlatformSponsorFormDialogForm } from "./PlatformSponsorFormDialogForm";
import { PlatformSponsorFormDialogHeader } from "./PlatformSponsorFormDialogHeader";

export interface PlatformSponsorFormDialogProps {
  open: boolean;
  editingSponsor: PlatformSponsor | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: UpsertPlatformSponsorInput) => Promise<void>;
}

function formKey(open: boolean, editingSponsor: PlatformSponsor | null) {
  return `${open}-${editingSponsor?.id ?? "new"}`;
}

export function PlatformSponsorFormDialog({
  open,
  editingSponsor,
  isSaving,
  onOpenChange,
  onSave,
}: PlatformSponsorFormDialogProps) {
  const { t } = useTranslation();

  const title = editingSponsor
    ? t("admin.platformSponsors.formTitleEdit")
    : t("admin.platformSponsors.formTitleAdd");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[416px] gap-0 overflow-visible rounded-[12px] border-black/10 px-[15px] py-5 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]"
      >
        <PlatformSponsorFormDialogHeader title={title} />

        <PlatformSponsorFormDialogForm
          key={formKey(open, editingSponsor)}
          editingSponsor={editingSponsor}
          isSaving={isSaving}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
}
