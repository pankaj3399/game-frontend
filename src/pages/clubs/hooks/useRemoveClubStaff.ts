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
    mutationKey: ["club", "removeStaff"],

    onMutate: async (variables) => {
      const key = queryKeys.club.staff(variables.clubId);

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ClubStaffResponse>(key);
      if (!previous) return;

      const removedMember = previous.staff.find(
        (m) => m.id === variables.staffId
      );

      if (!removedMember) return;

      queryClient.setQueryData<ClubStaffResponse>(key, {
        ...previous,
        staff: previous.staff.filter((m) => m.id !== variables.staffId),
      });

      return { key, removedMember };
    },

    onError: (_error, _variables, context) => {
      if (!context?.key) return;

      queryClient.setQueryData<ClubStaffResponse>(context.key, (current) => {
        if (!current) return current;

        const member = context.removedMember;

        const exists = current.staff.some((m) => m.id === member.id);
        if (exists) return current;

        return {
          ...current,
          staff: [...current.staff, member],
        };
      });
    },

    onSuccess: async (_data, variables) => {
      if (user?.id === variables.staffId) {
        await checkAuth();

        queryClient.invalidateQueries({
          queryKey: queryKeys.auth.me(),
        });
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
