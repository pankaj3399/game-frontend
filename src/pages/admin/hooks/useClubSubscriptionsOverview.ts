import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { parseIsoDateSafely } from "@/utils/date";

export type ClubSubscriptionStatus =
  | "renewal_needed"
  | "subscribed"
  | "requested"
  | "nothing";

export interface ClubSubscriptionOverviewItem {
  id: string;
  name: string;
  members: number;
  subscription: {
    plan: "free" | "premium";
    expiresAt: Date | null;
    status: ClubSubscriptionStatus;
  };
}

interface ClubSubscriptionOverviewApiItem {
  id: string;
  name: string;
  members: number;
  subscription: {
    plan: "free" | "premium";
    expiresAt: string | null;
    status: ClubSubscriptionStatus;
  };
}

interface ClubSubscriptionsOverviewApiResponse {
  clubs: ClubSubscriptionOverviewApiItem[];
}

interface ClubSubscriptionsOverviewResponse {
  clubs: ClubSubscriptionOverviewItem[];
}

async function fetchClubSubscriptionsOverview(): Promise<ClubSubscriptionsOverviewResponse> {
  const res = await api.get<ClubSubscriptionsOverviewApiResponse>("/api/admin/clubs/subscriptions");

  return {
    clubs: res.data.clubs.map((club) => ({
      ...club,
      subscription: {
        ...club.subscription,
        expiresAt: parseIsoDateSafely(club.subscription.expiresAt),
      },
    })),
  };
}

export function useClubSubscriptionsOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.clubSubscriptions(),
    queryFn: fetchClubSubscriptionsOverview,
    enabled,
  });
}
