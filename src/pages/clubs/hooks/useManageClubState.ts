import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileView, setMobileView] = useState<"clubs" | "staff">("clubs");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [premiumExpiryModalOpen, setPremiumExpiryModalOpen] = useState(false);

  const clubIdParam = searchParams.get("clubId");

  const effectiveClubId = useMemo(() => {
    if (clubs.length === 0) {
      return null;
    }
    if (clubIdParam && clubs.some((club) => club.id === clubIdParam)) {
      return clubIdParam;
    }
    return clubs[0]?.id ?? null;
  }, [clubs, clubIdParam]);

  useEffect(() => {
    if (clubs.length === 0) {
      return;
    }
    const param = searchParams.get("clubId");
    const valid = param != null && clubs.some((club) => club.id === param);
    if (valid) {
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("clubId", clubs[0]!.id);
        return next;
      },
      { replace: true }
    );
  }, [clubs, searchParams, setSearchParams]);

  const setSelectedClubId = useCallback(
    (clubId: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("clubId", clubId);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === effectiveClubId) ?? null,
    [clubs, effectiveClubId]
  );

  return {
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
