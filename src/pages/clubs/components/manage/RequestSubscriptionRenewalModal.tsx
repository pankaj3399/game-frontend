import { useTranslation } from "react-i18next";
import { format, addDays, addMonths, addYears } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, XIcon } from "lucide-react";

interface RequestSubscriptionRenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentExpiryDate?: Date | null;
  onConfirm?: (selectedExpiryDate: Date) => Promise<void> | void;
  isSubmitting?: boolean;
}

type QuickExtendOption = {
  key: string;
  labelKey: string;
  applyToDate: (date: Date) => Date;
};

const QUICK_EXTEND_OPTIONS: QuickExtendOption[] = [
  {
    key: "30d",
    labelKey: "manageClub.quickExtend30Days",
    applyToDate: (date) => addDays(date, 30),
  },
  {
    key: "3m",
    labelKey: "manageClub.quickExtend3Months",
    applyToDate: (date) => addMonths(date, 3),
  },
  {
    key: "6m",
    labelKey: "manageClub.quickExtend6Months",
    applyToDate: (date) => addMonths(date, 6),
  },
  {
    key: "1y",
    labelKey: "manageClub.quickExtend1Year",
    applyToDate: (date) => addYears(date, 1),
  },
  {
    key: "2y",
    labelKey: "manageClub.quickExtend2Years",
    applyToDate: (date) => addYears(date, 2),
  },
  {
    key: "3y",
    labelKey: "manageClub.quickExtend3Years",
    applyToDate: (date) => addYears(date, 3),
  },
];

function toOptionLabel(date: Date) {
  return format(date, "dd/MM/yyyy");
}

export function RequestSubscriptionRenewalModal({
  open,
  onOpenChange,
  currentExpiryDate,
  onConfirm,
  isSubmitting = false,
}: RequestSubscriptionRenewalModalProps) {
  const { t } = useTranslation();

  /**
   * Always derive baseDate directly from props
   * (React Compiler will optimize this)
   */
  const baseDate = currentExpiryDate
    ? new Date(currentExpiryDate.getTime())
    : new Date();

  const defaultQuickExtend = QUICK_EXTEND_OPTIONS[1];

  /**
   * State now represents "intent", not computed result
   */
  const [activeQuickExtend, setActiveQuickExtend] = useState<string | null>(
    defaultQuickExtend?.key ?? null
  );

  const [manualDate, setManualDate] = useState<Date | null>(null);

  const [calendarOpen, setCalendarOpen] = useState(false);

  /**
   * Always derived → never stale
   */
  const selectedExpiryDate = (() => {
    if (manualDate) return manualDate;

    const option = QUICK_EXTEND_OPTIONS.find(
      (o) => o.key === activeQuickExtend
    );

    if (option) return option.applyToDate(baseDate);

    return baseDate;
  })();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setManualDate(null);
      setActiveQuickExtend(defaultQuickExtend?.key ?? null);
      setCalendarOpen(false);
    }
  };

  const handleQuickExtend = (option: QuickExtendOption) => {
    setManualDate(null);
    setActiveQuickExtend(option.key);
  };

  const handleConfirm = async () => {
    if (!onConfirm) {
      handleOpenChange(false);
      return;
    }

    try {
      await onConfirm(selectedExpiryDate);
      handleOpenChange(false);
    } catch {
      // noop (intentionally swallow; parent handles errors)
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[424px] max-w-[calc(100%-2rem)] gap-0 rounded-[12px] border border-[rgba(1,10,4,0.08)] p-[20px_15px] shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]"
      >
        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[21px] font-semibold leading-none text-[#010a04]">
                {t("manageClub.expiryModalTitle")}
              </h2>
              <DialogClose asChild>
                <Button
                  className="inline-flex size-6 items-center justify-center text-[#010a04]/70 transition-colors hover:text-[#010a04]"
                  aria-label={t("manageClub.renewModalClose")}
                >
                  <XIcon className="size-5" />
                </Button>
              </DialogClose>
            </div>
            <div className="h-px w-full bg-black/10" />
          </div>

          <div className="flex flex-col items-start gap-[25px]">
            <p className="w-full text-[14px] leading-[1.4] font-normal text-[#010a04]/50">
              {t("manageClub.expiryModalDescription")}
            </p>

            {/* Date picker */}
            <div className="flex w-full flex-col gap-[10px]">
              <p className="text-[12px] font-medium uppercase text-[#010a04]/70">
                {t("manageClub.expiryDate")}
              </p>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-[42px] w-full justify-between rounded-[8px] border border-[#e1e3e8] bg-[#f9fafc] px-[12px] py-[8px] text-[14px] font-medium text-[#010a04] shadow-none hover:bg-[#f9fafc]"
                  >
                    <span>{toOptionLabel(selectedExpiryDate)}</span>
                    <ChevronRightIcon className="size-4 rotate-90 text-[#010a04]/55" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    className="w-full"
                    classNames={{ root: "w-full" }}
                    selected={selectedExpiryDate}
                    onSelect={(date) => {
                      if (!date) return;
                      setManualDate(date);
                      setActiveQuickExtend(null);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick extend */}
            <div className="flex w-full flex-col gap-[10px]">
              <p className="text-[12px] font-medium uppercase text-[#010a04]/70">
                {t("manageClub.quickExtend")}
              </p>
              <div className="grid grid-cols-3 gap-[10px]">
                {QUICK_EXTEND_OPTIONS.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-[42px] rounded-[8px] border border-[#e1e3e8] bg-[#f9fafc] px-[12px] py-[8px] text-[14px] font-medium text-[#010a04] shadow-none hover:bg-[#f9fafc]",
                      activeQuickExtend === option.key &&
                        !manualDate &&
                        "border-[rgba(6,116,41,0.44)] bg-[rgba(6,116,41,0.08)] hover:bg-[rgba(6,116,41,0.08)]"
                    )}
                    onClick={() => handleQuickExtend(option)}
                  >
                    {t(option.labelKey)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="flex w-full items-center border-l-[2.5px] border-[#067429] bg-[rgba(6,116,41,0.10)] py-[12px] pr-[12px] pl-[15px]">
              <p className="text-[13px] leading-[1.4] font-normal text-[#010a04]">
                <span className="font-semibold">💡 Tip:</span>
                <span>{" "}{t("manageClub.expiryTipBody")}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex w-full items-center justify-center gap-[12px]">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
                className="h-[38px] flex-1 rounded-[8px] border border-[rgba(0,0,0,0.15)] bg-white text-[16px] font-medium text-[#010a04] shadow-none hover:bg-white"
              >
                {t("manageClub.renewModalClose")}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}