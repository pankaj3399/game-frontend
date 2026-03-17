import { useMemo, useState } from "react";
import type { AdminClub } from "@/pages/clubs/hooks";

export function shouldShowSubscriptionBanner(
  subscription: { plan: string; expiresAt: string | null; subscriptionStatus: string } | undefined
): boolean {
  if (!subscription) return false;
  if (subscription.subscriptionStatus === "renewal_needed") return true;
  if (!subscription.expiresAt) return false;

  const expiresAt = new Date(subscription.expiresAt);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return expiresAt <= sevenDaysFromNow;
}

export function useManageClubState(clubs: AdminClub[]) {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"clubs" | "staff">("clubs");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === selectedClubId) ?? null,
    [clubs, selectedClubId]
  );

  const effectiveClubId = selectedClub?.id ?? selectedClubId;

  return {
    selectedClubId,
    setSelectedClubId,
    selectedClub,
    effectiveClubId,
    mobileView,
    setMobileView,
    addModalOpen,
    setAddModalOpen,
    renewModalOpen,
    setRenewModalOpen,
  };
}
