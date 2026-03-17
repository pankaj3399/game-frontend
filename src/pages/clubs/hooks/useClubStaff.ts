import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

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
export type ClubSubscriptionStatus =
  | "renewal_needed"
  | "subscribed";

export interface ClubSubscription {
  plan: ClubPlan;
  expiresAt: string | null;
  subscriptionStatus: ClubSubscriptionStatus;
}

interface ClubStaffResponse {
  staff: ClubStaffMember[];
  subscription: ClubSubscription;
}

async function fetchClubStaff(clubId: string): Promise<ClubStaffResponse> {
  const res = await api.get<ClubStaffResponse>(`/api/clubs/${clubId}/staff`);
  return res.data;
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
  });
}
