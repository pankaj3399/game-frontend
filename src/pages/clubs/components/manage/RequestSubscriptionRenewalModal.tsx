import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GLOBAL_PARAMETERS } from "@/constants/constants";

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
      // noop – parent handles errors
    }
  };

  const contactMailto = `${GLOBAL_PARAMETERS.CONTACT_US_MAILTO}?subject=Premium%20Subscription%20Support`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[460px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-[16px] border border-[rgba(1,10,4,0.08)] p-0 shadow-[0px_16px_48px_rgba(0,0,0,0.12)]"
      >
        <div className="flex flex-col bg-white">

          {/* ── Header ── */}
          <div className="px-[22px] pb-[16px] pt-[22px]">
            <h2 className="text-[17px] font-semibold leading-snug text-[#0d0d0d]">
              {t("manageClub.renewModalTitle")}
            </h2>
            <p className="mt-[3px] text-[13px] text-[#6b7280]">
              100 EUR / year · invoice sent within 2–3 days
            </p>
          </div>

          <div className="h-px bg-[rgba(0,0,0,0.07)]" />

          {/* ── Merged payment + invoice paragraph ── */}
          <div className="px-[22px] py-[16px]">
            <p className="text-[13.5px] leading-[1.65] text-[#374151]">
              We'll send an invoice for{" "}
              <span className="font-medium text-[#0d0d0d]">100 EUR</span> to the
              email on your account. Payment goes to{" "}
              <span className="font-medium text-[#0d0d0d]">
                {GLOBAL_PARAMETERS.COMPANY_NAME}
              </span>{" "}
              · IBAN{" "}
              <span className="font-mono text-[12.5px] text-[#0d0d0d]">
                {GLOBAL_PARAMETERS.IBAN}
              </span>
              .
            </p>
          </div>

          {/* ── Instant access callout ── */}
          <div className="mx-[22px] mb-[16px] rounded-[10px] bg-[rgba(235,146,15,0.08)] px-[14px] py-[11px]">
            <p className="text-[13px] leading-[1.6] text-[#7a4000]">
              Premium is already active for{" "}
              <span className="font-semibold">2 weeks</span>. It stays active once
              the invoice is paid.
            </p>
          </div>

          <div className="h-px bg-[rgba(0,0,0,0.07)]" />

          {/* ── Support note ── */}
          <p className="px-[22px] py-[13px] text-[12.5px] leading-[1.6] text-[#6b7280]">
            Having trouble?{" "}
            <a
              href={contactMailto}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#eb920f] underline-offset-2 transition-opacity hover:opacity-75 hover:underline"
            >
              Contact us
            </a>{" "}
            and we'll help you get set up.
          </p>

          <div className="h-px bg-[rgba(0,0,0,0.07)]" />

          {/* ── Actions ── */}
          <div className="flex items-center gap-[10px] px-[22px] py-[16px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="h-[42px] flex-1 rounded-[10px] border border-[rgba(0,0,0,0.13)] bg-white text-[13.5px] font-medium text-[#444] shadow-none transition-colors hover:bg-[rgba(0,0,0,0.04)] active:scale-[0.98]"
            >
              {t("manageClub.renewModalCancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="h-[42px] flex-1 rounded-[10px] bg-gradient-to-r from-[#eb920f] to-[#d97c05] text-[13.5px] font-semibold text-white shadow-[0_4px_14px_rgba(235,146,15,0.35)] transition-all hover:shadow-[0_6px_20px_rgba(235,146,15,0.50)] hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? t("common.loading") : t("manageClub.renewModalConfirm")}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}