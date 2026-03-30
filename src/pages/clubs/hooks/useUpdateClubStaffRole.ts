import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAuth } from "@/pages/auth/hooks";
import type {
  ClubStaffResponse,
} from "@/pages/clubs/hooks/useClubStaff";

export type EditableClubStaffRole = "admin" | "organiser";

interface UpdateClubStaffRoleInput {
  clubId: string;
  staffId: string;
  role: EditableClubStaffRole;
}

interface UpdateClubStaffRoleResponse {
  message: string;
  staff: {
    id: string;
    email: string;
    name: string | null;
    alias: string | null;
    role: EditableClubStaffRole;
    roleLabel: string;
  };
}

async function updateClubStaffRole({
  clubId,
  staffId,
  role,
}: UpdateClubStaffRoleInput): Promise<UpdateClubStaffRoleResponse> {
  const res = await api.patch<UpdateClubStaffRoleResponse>(
    `/api/clubs/${clubId}/staff/${staffId}`,
    { role }
  );

  return res.data;
}

export function useUpdateClubStaffRole() {
  const queryClient = useQueryClient();
  const { checkAuth, user } = useAuth();

  return useMutation({
    mutationFn: updateClubStaffRole,
    mutationKey: ["club", "updateStaffRole"],

    onMutate: async (variables) => {
      const key = queryKeys.club.staff(variables.clubId);

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ClubStaffResponse>(key);
      if (!previous) return;

      const targetMember = previous.staff.find(
        (m) => m.id === variables.staffId
      );

      if (!targetMember) return;

      const previousRole = targetMember.role;
      const previousRoleLabel = targetMember.roleLabel;

      queryClient.setQueryData<ClubStaffResponse>(key, {
        ...previous,
        staff: previous.staff.map((member) => {
          if (member.id !== variables.staffId) return member;

          return {
            ...member,
            role: variables.role,
          };
        }),
      });

      return {
        key,
        staffId: variables.staffId,
        previousRole,
        previousRoleLabel,
      };
    },

    // 🔴 Granular rollback (no snapshot overwrite)
    onError: (_error, _variables, context) => {
      if (!context?.key) return;

      queryClient.setQueryData<ClubStaffResponse>(context.key, (current) => {
        if (!current) return current;

        return {
          ...current,
          staff: current.staff.map((member) => {
            if (member.id !== context.staffId) return member;

            return {
              ...member,
              role: context.previousRole,
              roleLabel: context.previousRoleLabel,
            };
          }),
        };
      });
    },

    // ✅ Auth edge case (self role change)
    onSuccess: async (_data, variables) => {
      if (user?.id === variables.staffId) {
        await checkAuth();

        queryClient.invalidateQueries({
          queryKey: queryKeys.auth.me(),
        });
      }
    },

    // 🔄 Always sync with server
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.club.staff(variables.clubId),
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.user.adminClubs(),
      });
    },
  });
}