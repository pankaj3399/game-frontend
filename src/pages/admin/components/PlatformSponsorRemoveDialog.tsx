import { useTranslation } from "react-i18next";
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

export interface PlatformSponsorRemoveDialogProps {
  open: boolean;
  sponsorName: string | null;
  isRemoving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PlatformSponsorRemoveDialog({
  open,
  sponsorName,
  isRemoving,
  onOpenChange,
  onConfirm,
}: PlatformSponsorRemoveDialogProps) {
  const { t } = useTranslation();
  const descriptionName = sponsorName ?? t("admin.platformSponsors.removeNameFallback");

  function handleOpenChange(nextOpen: boolean) {
    if (isRemoving) return;
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.platformSponsors.removeTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.platformSponsors.removeDescription", { name: descriptionName })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>{t("sponsors.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm} disabled={isRemoving}>
            {isRemoving ? t("admin.platformSponsors.removing") : t("admin.platformSponsors.removeConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}