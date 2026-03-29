import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

interface RequestClubSubscriptionRenewalApiResponse {
  club: {
    id: string;
    plan: "free" | "premium";
    expiresAt: string | null;
    renewalRequestedAt: string | null;
  };
}

async function requestClubSubscriptionRenewal(clubId: string) {
  const response = await api.patch<RequestClubSubscriptionRenewalApiResponse>(
    `/api/clubs/${clubId}/subscription/renewal-request`
  );

  return response.data;
}

export function useRequestClubSubscriptionRenewal(clubId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!clubId) {
        throw new Error("clubId is required");
      }

      return requestClubSubscriptionRenewal(clubId);
    },
    onSuccess: () => {
      if (!clubId) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.club.staff(clubId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.club.detail(clubId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.adminClubs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clubSubscriptions() });
    },
  });
}