import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAuth } from "@/pages/auth/hooks";
import type {
  ClubStaffResponse,
  ClubStaffMember,
} from "@/pages/clubs/hooks/useClubStaff";
import type { QueryKey } from "@tanstack/react-query";

interface RemoveClubStaffInput {
  clubId: string;
  staffId: string;
}

interface RemoveClubStaffResponse {
  message: string;
  staffId: string;
}

interface RemoveClubStaffContext {
  key: QueryKey;
  removedMember: ClubStaffMember;
  originalIndex: number;
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
    RemoveClubStaffInput,
    RemoveClubStaffContext | undefined
  >({
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

      const originalIndex = previous.staff.findIndex(
        (m) => m.id === variables.staffId
      );

      queryClient.setQueryData<ClubStaffResponse>(key, {
        ...previous,
        staff: previous.staff.filter((m) => m.id !== variables.staffId),
      });

      return { key, removedMember, originalIndex };
    },

    onError: (_error, _variables, context) => {
      if (!context?.key) return;

      queryClient.setQueryData<ClubStaffResponse>(context.key, (current) => {
        if (!current) return current;

        const member = context.removedMember;
        const originalIndex: number | undefined = context.originalIndex;

        if (!member) return current;

        const exists = current.staff.some((m) => m.id === member.id);
        if (exists) return current;

        if (typeof originalIndex !== "number" || originalIndex === -1) {
          return {
            ...current,
            staff: [...current.staff, member],
          };
        }

        const idx = Math.max(0, Math.min(originalIndex, current.staff.length));
        return {
          ...current,
          staff: [
            ...current.staff.slice(0, idx),
            member,
            ...current.staff.slice(idx),
          ],
        };
      });
    },

    onSuccess: async (_data, variables) => {
      if (user?.id !== variables.staffId) return;

      try {
        await checkAuth();
      } catch (err) {
        // Replace with proper logging if available (e.g., Sentry)
        console.error("checkAuth failed after self-removal", err);
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.me(),
      });
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