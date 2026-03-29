import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon } from "@hugeicons/core-free-icons";

interface RequestSubscriptionRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export function RequestSubscriptionRenewalModal({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: RequestSubscriptionRenewalModalProps) {
  const { t } = useTranslation();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (!onConfirm) {
      handleOpenChange(false);
      return;
    }

    try {
      await onConfirm();
      handleOpenChange(false);
    } catch {
      // noop (intentionally swallow; parent handles errors)
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[414px] max-w-[calc(100%-2rem)] gap-0 rounded-[12px] border border-[rgba(1,10,4,0.08)] p-[20px_15px] shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]"
      >
        <div className="flex flex-col gap-[18px]">
          <div className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-[8px] bg-[#f6ecdd]">
            <HugeiconsIcon icon={CrownIcon} size={20} className="text-[#eb920f]" />
          </div>

          <div className="flex flex-col gap-[9px]">
            <h2 className="text-xl font-semibold leading-[1.15] text-[#010a04]">
              {t("manageClub.renewModalTitle")}
            </h2>
            <p className="text-sm leading-[1.4] text-[#010a04]/50">
              {t("manageClub.renewModalDescription")}
            </p>
          </div>

          <div className="flex w-full items-center justify-center gap-[12px] pt-[6px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="h-[50px] flex-1 rounded-[10px] border border-[rgba(0,0,0,0.15)] bg-white text-lg font-medium text-[#010a04] shadow-none hover:bg-white"
            >
              {t("manageClub.renewModalCancel")}
            </Button>
            <Button
              type="button"
              className="h-[50px] flex-1 rounded-[10px] bg-[#09872f] text-lg font-medium text-white hover:bg-[#08772a]"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {t("manageClub.renewModalConfirm")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}