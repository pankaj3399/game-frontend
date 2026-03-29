import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  addYears,
  differenceInCalendarDays,
  format,
  isSameDay,
} from "date-fns";
import {
  CalendarDays,
  Check,
  Circle,
  Crown,
  Info,
  Rocket,
  X,
} from "lucide-react";
import type { ClubSubscriptionOverviewItem } from "@/pages/admin/hooks/useClubSubscriptionsOverview";
import type { UpdateClubSubscriptionInput } from "@/pages/clubs/hooks";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ActionButtons } from "@/pages/admin/components/ActionButtons";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";

function isSameDate(left: Date | null, right: Date | null): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return isSameDay(left, right);
}

export interface ClubSubscriptionFormProps {
  club: ClubSubscriptionOverviewItem;
  onSave: (input: UpdateClubSubscriptionInput) => Promise<{
    plan: "free" | "premium";
    expiresAt: Date | null;
  }>;
  isSaving: boolean;
}

export function ClubSubscriptionForm({ club, onSave, isSaving }: ClubSubscriptionFormProps) {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = getDateFnsLocale(i18n.language);
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">(
    club.subscription.plan
  );
  const [renewalDate, setRenewalDate] = useState<Date | null>(club.subscription.expiresAt);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const formatDateInput = (date: Date | null): string => {
    if (!date) return "-";
    return format(date, "P", { locale: dateFnsLocale });
  };

  const formatLongDate = (date: Date | null): string => {
    if (!date) return t("admin.clubSubscription.dateUnknown");
    return format(date, "PPP", { locale: dateFnsLocale });
  };

  const membersText = t("admin.clubSubscription.membersCount", {
    formattedCount: club.members.toLocaleString(i18n.language),
  });

  const isRenewalExpired =
    renewalDate === null || differenceInCalendarDays(renewalDate, new Date()) < 0;
  const isPremiumActive = selectedPlan === "premium" && !isRenewalExpired;

  const hasUnsavedChanges =
    selectedPlan !== club.subscription.plan ||
    !isSameDate(renewalDate, club.subscription.expiresAt);

  const handleDiscard = () => {
    setSelectedPlan(club.subscription.plan);
    setRenewalDate(club.subscription.expiresAt);
    setCalendarOpen(false);
  };

  const handleSaveChanges = async () => {
    if (selectedPlan === "premium") {
      if (!renewalDate) {
        toast.error(t("admin.clubSubscription.toastPremiumRequiresDate"));
        return;
      }

      if (differenceInCalendarDays(renewalDate, new Date()) <= 0) {
        toast.error(t("admin.clubSubscription.toastExpirationFuture"));
        return;
      }
    }

    try {
      const result = await onSave({
        plan: selectedPlan,
        expiresAt: selectedPlan === "free" ? null : renewalDate,
      });

      setSelectedPlan(result.plan);
      setRenewalDate(result.expiresAt);
      toast.success(t("admin.clubSubscription.toastSuccess"));
    } catch (error) {
      toast.error(getErrorMessage(error) ?? t("admin.clubSubscription.toastErrorGeneric"));
    }
  };

  const bannerTitle = isPremiumActive
    ? t("admin.clubSubscription.bannerTitleActive")
    : t("admin.clubSubscription.bannerTitleExpired");

  return (
    <>
      <div className="mb-[25px] flex flex-col justify-between gap-5 md:mb-[22px] md:flex-row md:items-center">
        <div className="flex items-center gap-5">
          <div className="size-[55px] shrink-0 overflow-hidden rounded-[10px] bg-[#e4dbcc]">
            <img
              src="/tennis-ball.png"
              alt=""
              aria-hidden
              className="size-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-[24px] leading-none font-semibold text-[#010a04]">{club.name}</h1>
            <p className="mt-3 text-[14px] leading-none text-[#010a04]/60">{membersText}</p>
          </div>
        </div>

        <ActionButtons
          isPending={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          onDiscard={handleDiscard}
          onSave={handleSaveChanges}
          className="hidden items-center gap-3 md:flex"
        />
      </div>

      <div className="mb-[25px] h-px w-full bg-black/10" />

      <div className="mb-[25px] rounded-[12px] border border-black/10 bg-[rgba(244,201,93,0.13)] px-[15px] py-[15px] md:mb-[17px]">
        <div className="flex items-start gap-[14px]">
          <Info className="mt-[2px] size-[18px] shrink-0 text-[#906500]" aria-hidden />
          <div className="min-w-0">
            <p className="mb-2 text-[14px] font-medium text-[#906500]">{bannerTitle}</p>
            <p className="text-[13px] leading-[1.35] text-[#906500]">
              {t("admin.clubSubscription.renewalRequired")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[19px] md:grid-cols-2 md:gap-[17px]">
        <section className="overflow-hidden rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]">
          <div className="p-[18px] md:p-[22px]">
            <h2 className="mb-[17px] text-[18px] leading-none font-medium text-[#010a04]">
              {t("admin.clubSubscription.subscriptionPlan")}
            </h2>

            <div className="flex flex-row gap-[12px] md:gap-[15px]">
              <button
                type="button"
                onClick={() => setSelectedPlan("free")}
                className={cn(
                  "flex-1 rounded-[12px] border bg-white p-[15px] text-left shadow-[0px_0px_6px_0px_rgba(0,0,0,0.02),0px_2px_4px_0px_rgba(0,0,0,0.08)]",
                  selectedPlan === "free"
                    ? "border-[rgba(1,10,4,0.22)]"
                    : "border-[rgba(0,0,0,0.12)]"
                )}
              >
                <div className="mb-[25px] flex items-start justify-between">
                  <Rocket className="size-6 text-[#0f8d33]" />
                  <Circle
                    className={cn(
                      "size-[18px]",
                      selectedPlan === "free" ? "fill-[#067429] text-[#067429]" : "text-black/15"
                    )}
                  />
                </div>
                <p className="text-[16px] font-medium text-[#010a04]">
                  {t("admin.clubSubscription.planFree")}
                </p>
                <p className="mt-[6px] text-[12px] text-[#010a04]/60">
                  {t("admin.clubSubscription.planFreeDescription")}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("premium")}
                className={cn(
                  "flex-1 rounded-[12px] border p-[15px] text-left shadow-[0px_0px_6px_0px_rgba(0,0,0,0.02),0px_2px_4px_0px_rgba(0,0,0,0.08)]",
                  selectedPlan === "premium"
                    ? "border-[1.5px] border-[#067429] bg-[linear-gradient(90deg,rgba(10,105,37,0.04)_0%,rgba(10,105,37,0.04)_100%),linear-gradient(90deg,#fff_0%,#fff_100%)]"
                    : "border-[rgba(0,0,0,0.12)] bg-white"
                )}
              >
                <div className="mb-[25px] flex items-start justify-between">
                  <Crown className="size-6 text-[#f59e0b]" />
                  <Circle
                    className={cn(
                      "size-[18px]",
                      selectedPlan === "premium"
                        ? "fill-[#067429] text-[#067429]"
                        : "text-black/15"
                    )}
                  />
                </div>
                <p className="text-[16px] font-medium text-[#010a04]">
                  {t("admin.clubSubscription.planPremium")}
                </p>
                <p className="mt-[6px] text-[12px] text-[#010a04]/60">
                  {t("admin.clubSubscription.planPremiumDescription")}
                </p>
              </button>
            </div>
          </div>

          <div className="border-t border-black/10 bg-[rgba(1,10,4,0.03)] p-[22px]">
            <p className="mb-[10px] text-[12px] font-medium tracking-[0.02em] text-[#010a04]/70 uppercase">
              {t("admin.clubSubscription.renewalDate")}
            </p>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-[38px] w-full justify-between rounded-[8px] px-[12px] text-[14px] font-medium text-[#010a04] shadow-none",
                    isPremiumActive
                      ? "border border-[rgba(1,10,4,0.09)] bg-white shadow-[0px_0px_6px_0px_rgba(0,0,0,0.02),0px_2px_4px_0px_rgba(0,0,0,0.08)] hover:bg-white"
                      : "border border-[rgba(217,33,0,0.25)] bg-[linear-gradient(90deg,rgba(217,33,0,0.08)_0%,rgba(217,33,0,0.08)_100%),linear-gradient(90deg,#fff_0%,#fff_100%)] hover:bg-[linear-gradient(90deg,rgba(217,33,0,0.08)_0%,rgba(217,33,0,0.08)_100%),linear-gradient(90deg,#fff_0%,#fff_100%)]"
                  )}
                >
                  <span>{formatDateInput(renewalDate)}</span>
                  <CalendarDays className="size-[18px] text-[#010a04]" />
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
                  selected={renewalDate ?? undefined}
                  onSelect={(date) => {
                    if (!date) return;
                    setRenewalDate(date);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => differenceInCalendarDays(date, new Date()) <= 0}
                  captionLayout="dropdown"
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="mt-[10px] flex items-center justify-between gap-2 text-[12px] md:text-[13px]">
              <p
                className={cn(
                  "opacity-70",
                  isRenewalExpired ? "text-[#d92100] opacity-100" : "text-[#010a04]"
                )}
              >
                {isRenewalExpired
                  ? t("admin.clubSubscription.statusExpiredOn", {
                      date: formatLongDate(renewalDate),
                    })
                  : t("admin.clubSubscription.statusActiveUntil", {
                      date: formatLongDate(renewalDate),
                    })}
              </p>
              {isRenewalExpired ? (
                <button
                  type="button"
                  onClick={() => setRenewalDate(addYears(new Date(), 1))}
                  className="font-medium text-[#067429] underline"
                >
                  {t("admin.clubSubscription.setOneYearFromToday")}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[12px] border border-[rgba(1,10,4,0.12)] px-[20px] py-[22px]">
          <h3 className="mb-[21px] text-[15px] font-medium text-[#010a04]">
            {t("admin.clubSubscription.whatThisMeans")}
          </h3>
          <ul className="space-y-[12px]">
            <li className="flex items-start gap-[8px] text-[13px] text-[#010a04]/80">
              {isPremiumActive ? (
                <Check className="mt-px size-4 shrink-0 text-[#067429]" />
              ) : (
                <X className="mt-px size-4 shrink-0 text-[#d92100]" />
              )}
              <span>
                {isPremiumActive
                  ? t("admin.clubSubscription.meaningUnlimitedAdmins")
                  : t("admin.clubSubscription.meaningNoNewAdmins")}
              </span>
            </li>
            <li className="flex items-start gap-[8px] text-[13px] text-[#010a04]/80">
              {isPremiumActive ? (
                <Check className="mt-px size-4 shrink-0 text-[#067429]" />
              ) : (
                <X className="mt-px size-4 shrink-0 text-[#d92100]" />
              )}
              <span>
                {isPremiumActive
                  ? t("admin.clubSubscription.meaningSponsorsVisible")
                  : t("admin.clubSubscription.meaningSponsorsHidden")}
              </span>
            </li>
            <li className="flex items-start gap-[8px] text-[13px] text-[#010a04]/80">
              <Check className="mt-px size-4 shrink-0 text-[#067429]" />
              <span>{t("admin.clubSubscription.meaningDataPreserved")}</span>
            </li>
          </ul>
        </section>
      </div>

      <ActionButtons
        isPending={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        onDiscard={handleDiscard}
        onSave={handleSaveChanges}
        className="mt-6 flex items-center gap-3 md:hidden"
      />
    </>
  );
}
