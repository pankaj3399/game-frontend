import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAuth } from "@/pages/auth/hooks";

interface RemoveClubStaffInput {
  clubId: string;
  staffId: string;
}

interface RemoveClubStaffResponse {
  message: string;
  staffId: string;
}

async function removeClubStaff({
  clubId,
  staffId,
}: RemoveClubStaffInput): Promise<RemoveClubStaffResponse> {
  const res = await api.delete<RemoveClubStaffResponse>(
    `/api/clubs/${clubId}/staff/${staffId}`
  );
  return res.data;
}

export function useRemoveClubStaff() {
  const queryClient = useQueryClient();
  const { checkAuth, user } = useAuth();

  return useMutation<
    RemoveClubStaffResponse,
    unknown,
    RemoveClubStaffInput
  >({
    mutationFn: removeClubStaff,
    mutationKey: ["club", "removeStaff"],

    onSuccess: async (_data, variables) => {
      if (user?.id !== variables.staffId) return;

      try {
        await checkAuth();
      } catch (err) {
        // Replace with proper logging if available (e.g., Sentry)
        console.error("checkAuth failed after self-removal", err);
      }
    },

    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.club.staff(variables.clubId),
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.user.adminClubs(),
      });
    },
  });
}