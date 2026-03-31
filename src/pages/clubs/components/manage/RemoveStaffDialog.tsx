import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ClubStaffMember } from "@/pages/clubs/hooks";

interface RemoveStaffDialogProps {
  open: boolean;
  member: ClubStaffMember | null;
  isRemoving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function RemoveStaffDialog({
  open,
  member,
  isRemoving,
  onOpenChange,
  onConfirm,
}: RemoveStaffDialogProps) {
  const { t } = useTranslation();

  const memberLabel = member
    ? member.name?.trim() || member.alias?.trim() || member.email
    : t("manageClub.removeMemberFallback");

  function handleOpenChange(nextOpen: boolean) {
    if (isRemoving) return;
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("manageClub.removeMemberTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("manageClub.removeMemberDescription", { name: memberLabel })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRemoving}>
            {t("settings.adminClubsCancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isRemoving}
            onClick={() => {
              void onConfirm();
            }}
          >
            {isRemoving ? t("common.loading") : t("manageClub.remove")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
