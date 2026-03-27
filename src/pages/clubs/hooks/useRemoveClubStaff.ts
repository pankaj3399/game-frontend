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
  const { checkAuth } = useAuth();

  return useMutation({
    mutationFn: removeClubStaff,
    onSuccess: async (_, variables) => {
      await checkAuth();
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.club.staff(variables.clubId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.adminClubs(),
      });
    },
  });
}
