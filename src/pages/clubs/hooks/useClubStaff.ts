import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { parseIsoDateSafely } from "@/utils/date";

export type ClubStaffRole = "default_admin" | "admin" | "organiser";

export interface ClubStaffMember {
  id: string;
  email: string;
  name: string | null;
  alias: string | null;
  role: ClubStaffRole;
  roleLabel: string;
}

export type ClubPlan = "free" | "premium";

export interface ClubSubscription {
  plan: ClubPlan;
  expiresAt: Date | null;
  renewalRequestedAt: Date | null;
}

interface ClubStaffResponse {
  staff: ClubStaffMember[];
  subscription: ClubSubscription;
}

interface ClubStaffApiResponse {
  staff: ClubStaffMember[];
  subscription: {
    plan: ClubPlan;
    expiresAt: string | null;
    renewalRequestedAt: string | null;
  };
}

function mapClubStaffResponse(data: ClubStaffApiResponse): ClubStaffResponse {
  return {
    staff: data.staff,
    subscription: {
      plan: data.subscription.plan,
      expiresAt: parseIsoDateSafely(data.subscription.expiresAt),
      renewalRequestedAt: parseIsoDateSafely(data.subscription.renewalRequestedAt),
    },
  };
}

async function fetchClubStaff(clubId: string): Promise<ClubStaffResponse> {
  const res = await api.get<ClubStaffApiResponse>(`/api/clubs/${clubId}/staff`);
  return mapClubStaffResponse(res.data);
}

export function useClubStaff(clubId: string | null) {
  return useQuery({
    queryKey: queryKeys.club.staff(clubId ?? ""),
    queryFn: () => {
      if (!clubId) {
        throw new Error("clubId is required");
      }
      return fetchClubStaff(clubId);
    },
    enabled: !!clubId,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
