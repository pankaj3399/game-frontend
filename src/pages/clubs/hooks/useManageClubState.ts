import { useMemo, useState } from "react";
import type { AdminClub } from "@/pages/clubs/hooks";
import {
  isSubscriptionExpiredByLocalDay,
  isWithinCalendarDaysFromNow,
} from "@/utils/date";

export function shouldShowSubscriptionBanner(
  subscription: { plan: string; expiresAt: Date | null } | undefined
): boolean {
  if (!subscription) return false;
  if (subscription.plan === "free") return true;
  if (subscription.plan !== "premium") return false;

  if (!subscription.expiresAt) return true;

  if (isSubscriptionExpiredByLocalDay(subscription.expiresAt)) return true;

  return isWithinCalendarDaysFromNow(subscription.expiresAt, 7);
}

export function useManageClubState(clubs: AdminClub[]) {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"clubs" | "staff">("clubs");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [premiumExpiryModalOpen, setPremiumExpiryModalOpen] = useState(false);

  const fallbackClubId = clubs[0]?.id ?? null;
  const hasSelectedClub =
    selectedClubId != null && clubs.some((club) => club.id === selectedClubId);
  const resolvedClubId = hasSelectedClub ? selectedClubId : fallbackClubId;

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === resolvedClubId) ?? null,
    [clubs, resolvedClubId]
  );

  const effectiveClubId = selectedClub?.id ?? null;

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
