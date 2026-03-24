import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

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
        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-[22px]">
            <div className="inline-flex size-[55px] items-center justify-center rounded-[12px] bg-[#d96d00]/10 text-[#d96d00]">
              <Crown className="size-[30px]" />
            </div>
            <div className="flex w-full flex-col gap-[12px]">
              <h2 className="text-[21px] font-semibold leading-normal text-[#010a04]">
                {t("manageClub.renewModalTitle")}
              </h2>
              <p className="w-full text-[14px] leading-[1.4] font-normal text-[#010a04]/50">
                {t("manageClub.renewModalDescription")}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-[12px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="h-[38px] flex-1 rounded-[8px] border border-[rgba(0,0,0,0.15)] bg-white text-[16px] font-medium text-[#010a04] shadow-none hover:bg-white"
            >
              {t("manageClub.renewModalCancel")}
            </Button>
            <Button
              type="button"
              className="h-[38px] flex-1 rounded-[8px] bg-linear-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] text-[16px] font-medium text-white hover:opacity-95"
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