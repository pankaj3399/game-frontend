import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RequestSubscriptionRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
}

export function RequestSubscriptionRenewalModal({
  open,
  onOpenChange,
  onConfirm,
}: RequestSubscriptionRenewalModalProps) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500/80 text-amber-600">
            <HugeiconsIcon icon={CrownIcon} size={24} aria-hidden />
          </div>
          <DialogTitle className="text-xl">{t("manageClub.renewModalTitle")}</DialogTitle>
        </DialogHeader>
        <p className="text-center text-sm text-muted-foreground">
          {t("manageClub.renewModalDescription")}
        </p>
        <DialogFooter className="flex gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-initial"
          >
            {t("manageClub.renewModalCancel")}
          </Button>
          <Button
            className="flex-1 bg-brand-primary hover:bg-brand-primary-hover sm:flex-initial"
            onClick={handleConfirm}
          >
            {t("manageClub.renewModalConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
