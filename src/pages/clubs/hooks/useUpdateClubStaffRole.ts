import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { useAuth } from "@/pages/auth/hooks";
import type { ClubStaffResponse } from "@/pages/clubs/hooks/useClubStaff";

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
    onMutate: async (variables) => {
      const key = queryKeys.club.staff(variables.clubId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ClubStaffResponse>(key);
      if (!previous) {
        return { previous, key };
      }

      const nextStaff = previous.staff.map((member) => {
        if (member.id !== variables.staffId) {
          return member;
        }

        return {
          ...member,
          role: variables.role,
          roleLabel: variables.role === "admin" ? "Admin" : "Organiser",
        };
      });

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
        const nextStaff = current.staff.map((member) => {
          if (member.id !== data.staff.id) {
            return member;
          }

          return {
            ...member,
            role: data.staff.role,
            roleLabel: data.staff.roleLabel,
          };
        });

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
