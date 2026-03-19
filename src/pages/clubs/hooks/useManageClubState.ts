import { useMemo, useState } from "react";
import type { AdminClub } from "@/pages/clubs/hooks";

export function shouldShowSubscriptionBanner(
  subscription: { plan: string; expiresAt: Date | null } | undefined
): boolean {
  if (!subscription) return false;
  if (subscription.plan !== "premium") return false;

  if (!subscription.expiresAt) return true;

  if (subscription.expiresAt.getTime() < Date.now()) return true;

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return subscription.expiresAt <= sevenDaysFromNow;
}

export function useManageClubState(clubs: AdminClub[]) {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"clubs" | "staff">("clubs");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [premiumExpiryModalOpen, setPremiumExpiryModalOpen] = useState(false);

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
    premiumExpiryModalOpen,
    setPremiumExpiryModalOpen,
  };
}
