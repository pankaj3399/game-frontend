import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAuth } from "@/pages/auth/hooks";
import type { ClubStaffResponse } from "@/pages/clubs/hooks/useClubStaff";

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

  return useMutation({
    mutationFn: removeClubStaff,
    onMutate: async (variables) => {
      const key = queryKeys.club.staff(variables.clubId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ClubStaffResponse>(key);
      if (!previous) {
        return { previous, key };
      }

      const nextStaff = previous.staff.filter(
        (member) => member.id !== variables.staffId,
      );

      queryClient.setQueryData<ClubStaffResponse>(key, {
        ...previous,
        staff: nextStaff,
      });

      return { previous, key };
    },
    onError: (_error, _variables, context) => {
      if (!context?.previous || !context.key) {
        return;
      }

      queryClient.setQueryData(context.key, context.previous);
    },
    onSuccess: async (data, variables) => {
      const key = queryKeys.club.staff(variables.clubId);
      const current = queryClient.getQueryData<ClubStaffResponse>(key);
      if (current) {
        const nextStaff = current.staff.filter(
          (member) => member.id !== data.staffId,
        );

        queryClient.setQueryData<ClubStaffResponse>(key, {
          ...current,
          staff: nextStaff,
        });
      }

      if (user?.id === variables.staffId) {
        await checkAuth();
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.adminClubs(),
      });
    },
  });
}
