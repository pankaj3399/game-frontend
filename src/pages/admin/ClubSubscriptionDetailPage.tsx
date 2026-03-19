import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { addYears, differenceInCalendarDays, format } from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Circle,
  Crown,
  Info,
  Rocket,
  X,
} from "lucide-react";
import { useAuth, useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { useClubSubscriptionsOverview } from "@/pages/admin/hooks/useClubSubscriptionsOverview";
import { useUpdateClubSubscription } from "@/pages/clubs/hooks";
import InlineLoader from "@/components/shared/InlineLoader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

function formatDateInput(date: Date | null): string {
  if (!date) return "-";
  return format(date, "dd/MM/yyyy");
}

function formatLongDate(date: Date | null): string {
  if (!date) return "Unknown";
  return format(date, "MMMM d, yyyy");
}

function isSameDate(left: Date | null, right: Date | null): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.getTime() === right.getTime();
}

export default function ClubSubscriptionDetailPage() {
  const hasAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const { data, isLoading } = useClubSubscriptionsOverview(hasAccess);
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const updateClubSubscription = useUpdateClubSubscription(clubId ?? null);

  const selectedClub = useMemo(() => {
    const rows = data?.clubs ?? [];
    if (!clubId) return rows[0] ?? null;
    return rows.find((club) => club.id === clubId) ?? null;
  }, [clubId, data?.clubs]);

  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("free");
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!selectedClub) return;
    setSelectedPlan(selectedClub.subscription.plan);
    setRenewalDate(selectedClub.subscription.expiresAt);
  }, [selectedClub]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <InlineLoader />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;
  if (!hasAccess) return <Navigate to="/profile" replace />;

  const membersText = selectedClub
    ? `${selectedClub.members.toLocaleString()} members`
    : "-";

  const isRenewalExpired =
    renewalDate === null || differenceInCalendarDays(renewalDate, new Date()) < 0;
  const isPremiumActive = selectedPlan === "premium" && !isRenewalExpired;

  const hasUnsavedChanges =
    !!selectedClub &&
    (selectedPlan !== selectedClub.subscription.plan ||
      !isSameDate(renewalDate, selectedClub.subscription.expiresAt));

  const handleDiscard = () => {
    if (!selectedClub) return;
    setSelectedPlan(selectedClub.subscription.plan);
    setRenewalDate(selectedClub.subscription.expiresAt);
    setCalendarOpen(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedClub) return;

    if (selectedPlan === "premium") {
      if (!renewalDate) {
        toast.error("Premium plan requires a future expiration date.");
        return;
      }

      if (differenceInCalendarDays(renewalDate, new Date()) <= 0) {
        toast.error("Expiration date must be in the future.");
        return;
      }
    }

    try {
      const response = await updateClubSubscription.mutateAsync({
        plan: selectedPlan,
        expiresAt: selectedPlan === "free" ? null : renewalDate,
      });

      setSelectedPlan(response.club.plan);
      setRenewalDate(response.club.expiresAt);
      toast.success("Subscription updated successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error) ?? "Failed to update subscription.");
    }
  };

  const bannerTitle = isPremiumActive ? "All Premium Features Active" : "Premium Expired";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fbf8]">
      <div className="mx-auto w-full max-w-[992px] px-5 pt-8 pb-10 md:px-6 md:pt-9">
        <button
          type="button"
          onClick={() => navigate("/admin/clubs-subscriptions")}
          className="mb-[25px] inline-flex items-center gap-[6px] text-[14px] font-medium text-[#010a04]"
        >
          <ChevronLeft className="size-4" />
          <span>Go back</span>
        </button>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <InlineLoader />
          </div>
        ) : !selectedClub ? (
          <div className="rounded-[12px] border border-black/10 bg-white p-6 text-center text-sm text-[#010a04]/70">
            Club not found.
          </div>
        ) : (
          <>
            <div className="mb-[25px] flex flex-col justify-between gap-5 md:mb-[22px] md:flex-row md:items-center">
              <div className="flex items-center gap-5">
                <div className="relative size-[55px] shrink-0 rounded-[10px] bg-[#e4dbcc] p-[6px]">
                  <div className="relative size-full rounded-full bg-radial-[at_30%_30%] from-[#d7ef3e] to-[#8db712]">
                    <span className="absolute -top-[2px] left-[15px] h-[40px] w-[10px] rotate-12 rounded-full border border-white/90 bg-white/80" />
                    <span className="absolute -bottom-[2px] right-[15px] h-[40px] w-[10px] rotate-12 rounded-full border border-white/90 bg-white/80" />
                  </div>
                </div>
                <div>
                  <h1 className="text-[24px] leading-none font-semibold text-[#010a04]">
                    {selectedClub.name}
                  </h1>
                  <p className="mt-3 text-[14px] leading-none text-[#010a04]/60">
                    {membersText}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDiscard}
                  disabled={updateClubSubscription.isPending || !hasUnsavedChanges}
                  className="h-[42px] rounded-[10px] border border-[rgba(1,10,4,0.2)] bg-white px-[18px] text-[16px] font-medium text-[#010a04] shadow-none hover:bg-white"
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={updateClubSubscription.isPending || !hasUnsavedChanges}
                  className="h-[42px] rounded-[8px] bg-linear-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] px-[16px] text-[16px] font-medium text-white hover:opacity-95"
                >
                  {updateClubSubscription.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <div className="mb-[25px] h-px w-full bg-black/10" />

            <div className="mb-[25px] rounded-[12px] border border-black/10 bg-[rgba(244,201,93,0.13)] px-[15px] py-[15px] md:mb-[17px]">
              <div className="flex items-start gap-[14px]">
                <Info className="mt-[2px] size-[18px] shrink-0 text-[#906500]" aria-hidden />
                <div className="min-w-0">
                  <p className="mb-2 text-[14px] font-medium text-[#906500]">{bannerTitle}</p>
                  <p className="text-[13px] leading-[1.35] text-[#906500]">
                    Renewal Required: Sponsors are currently hidden. New admins/organizers cannot be
                    added. Existing data is safe. Set a renewal date to restore sponsor visibility and
                    allow admin additions.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-[19px] md:grid-cols-2 md:gap-[17px]">
              <section className="overflow-hidden rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]">
                <div className="p-[18px] md:p-[22px]">
                  <h2 className="mb-[17px] text-[18px] leading-none font-medium text-[#010a04]">
                    Subscription Plan
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
                      <p className="text-[16px] font-medium text-[#010a04]">Free</p>
                      <p className="mt-[6px] text-[12px] text-[#010a04]/60">Basic club features</p>
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
                      <p className="text-[16px] font-medium text-[#010a04]">Premium</p>
                      <p className="mt-[6px] text-[12px] text-[#010a04]/60">Full features + sponsors</p>
                    </button>
                  </div>
                </div>

                <div className="border-t border-black/10 bg-[rgba(1,10,4,0.03)] p-[22px]">
                  <p className="mb-[10px] text-[12px] font-medium tracking-[0.02em] text-[#010a04]/70 uppercase">
                    Renewal Date
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
                    <p className={cn("opacity-70", isRenewalExpired ? "text-[#d92100] opacity-100" : "text-[#010a04]")}>
                      <span>{isRenewalExpired ? "Expired on " : "Active until "}</span>
                      <span>{formatLongDate(renewalDate)}</span>
                    </p>
                    {isRenewalExpired ? (
                      <button
                        type="button"
                        onClick={() => setRenewalDate(addYears(new Date(), 1))}
                        className="font-medium text-[#067429] underline"
                      >
                        Set to 1 year from today
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-[12px] border border-[rgba(1,10,4,0.12)] px-[20px] py-[22px]">
                <h3 className="mb-[21px] text-[15px] font-medium text-[#010a04]">What This Means</h3>
                <ul className="space-y-[12px]">
                  <li className="flex items-start gap-[8px] text-[13px] text-[#010a04]/80">
                    {isPremiumActive ? (
                      <Check className="mt-px size-4 shrink-0 text-[#067429]" />
                    ) : (
                      <X className="mt-px size-4 shrink-0 text-[#d92100]" />
                    )}
                    <span>
                      {isPremiumActive
                        ? "Can add unlimited admins and organizers"
                        : "Cannot add new admins or organizers"}
                    </span>
                  </li>
                  <li className="flex items-start gap-[8px] text-[13px] text-[#010a04]/80">
                    {isPremiumActive ? (
                      <Check className="mt-px size-4 shrink-0 text-[#067429]" />
                    ) : (
                      <X className="mt-px size-4 shrink-0 text-[#d92100]" />
                    )}
                    <span>Sponsors hidden from public (admins can still see them)</span>
                  </li>
                  <li className="flex items-start gap-[8px] text-[13px] text-[#010a04]/80">
                    <Check className="mt-px size-4 shrink-0 text-[#067429]" />
                    <span>All data preserved - no deletions</span>
                  </li>
                </ul>
              </section>
            </div>

            <div className="mt-6 flex items-center gap-3 md:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscard}
                disabled={updateClubSubscription.isPending || !hasUnsavedChanges}
                className="h-[42px] flex-1 rounded-[10px] border border-[rgba(1,10,4,0.2)] bg-white px-[18px] text-[16px] font-medium text-[#010a04] shadow-none hover:bg-white"
              >
                Discard
              </Button>
              <Button
                type="button"
                onClick={handleSaveChanges}
                disabled={updateClubSubscription.isPending || !hasUnsavedChanges}
                className="h-[42px] flex-1 rounded-[8px] bg-linear-to-r from-[#0a6925] via-[#0c7b2c] to-[#0f8d33] px-[16px] text-[16px] font-medium text-white hover:opacity-95"
              >
                {updateClubSubscription.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
