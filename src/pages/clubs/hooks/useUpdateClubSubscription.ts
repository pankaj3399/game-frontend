import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { formatDateForApi, parseIsoDateSafely } from "@/utils/date";

export type ClubPlan = "free" | "premium";

export interface UpdateClubSubscriptionInput {
  plan?: ClubPlan;
  expiresAt?: Date | null;
}

interface UpdateClubSubscriptionResponse {
  club: {
    id: string;
    plan: ClubPlan;
    expiresAt: Date | null;
  };
}

interface UpdateClubSubscriptionApiInput {
  plan?: ClubPlan;
  expiresAt?: string | null;
}

interface UpdateClubSubscriptionApiResponse {
  club: {
    id: string;
    plan: ClubPlan;
    expiresAt: string | null;
  };
}

function serializeUpdateClubSubscriptionInput(
  input: UpdateClubSubscriptionInput
): UpdateClubSubscriptionApiInput {
  return {
    plan: input.plan,
    expiresAt:
      input.expiresAt === undefined
        ? undefined
        : input.expiresAt === null
          ? null
          : formatDateForApi(input.expiresAt),
  };
}

function mapUpdateClubSubscriptionResponse(
  response: UpdateClubSubscriptionApiResponse
): UpdateClubSubscriptionResponse {
  return {
    club: {
      id: response.club.id,
      plan: response.club.plan,
      expiresAt: parseIsoDateSafely(response.club.expiresAt),
    },
  };
}

async function updateClubSubscription(
  clubId: string,
  input: UpdateClubSubscriptionInput
) {
  const payload = serializeUpdateClubSubscriptionInput(input);
  const response = await api.patch<UpdateClubSubscriptionApiResponse>(
    `/api/admin/clubs/${clubId}/subscription`,
    payload
  );

  return mapUpdateClubSubscriptionResponse(response.data);
}

export function useUpdateClubSubscription(clubId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateClubSubscriptionInput) => {
      if (!clubId) {
        throw new Error("clubId is required");
      }

      return updateClubSubscription(clubId, input);
    },
    onSuccess: () => {
      if (!clubId) return;

      queryClient.invalidateQueries({ queryKey: queryKeys.club.staff(clubId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.club.detail(clubId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.adminClubs() });
    },
  });
}
