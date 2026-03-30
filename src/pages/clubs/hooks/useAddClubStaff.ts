import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  ClubStaffMember,
  ClubStaffResponse,
} from "@/pages/clubs/hooks/useClubStaff";

export type AddStaffRole = "admin" | "organiser";

interface AddClubStaffInput {
  clubId: string;
  userId: string;
  role: AddStaffRole;
}

interface AddClubStaffResponse {
  message: string;
  staff: {
    id: string;
    email: string;
    name: string | null;
    alias: string | null;
    role: AddStaffRole;
    roleLabel: string;
  };
}

function mapToClubStaffMember(staff: AddClubStaffResponse["staff"]): ClubStaffMember {
  return {
    id: staff.id,
    email: staff.email,
    name: staff.name,
    alias: staff.alias,
    role: staff.role,
    roleLabel: staff.roleLabel,
  };
}

async function addClubStaff({
  clubId,
  userId,
  role,
}: AddClubStaffInput): Promise<AddClubStaffResponse> {
  const res = await api.post<AddClubStaffResponse>(
    `/api/clubs/${clubId}/staff`,
    { userId, role }
  );
  return res.data;
}

export function useAddClubStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addClubStaff,
    onSuccess: (data, variables) => {
      const nextStaffMember = mapToClubStaffMember(data.staff);

      queryClient.setQueryData<ClubStaffResponse | undefined>(
        queryKeys.club.staff(variables.clubId),
        (previous) => {
          if (!previous) {
            return previous;
          }

          const existingIndex = previous.staff.findIndex(
            (member) => member.id === nextStaffMember.id,
          );

          if (existingIndex === -1) {
            return {
              ...previous,
              staff: [...previous.staff, nextStaffMember],
            };
          }

          const updatedStaff = [...previous.staff];
          updatedStaff[existingIndex] = nextStaffMember;

          return {
            ...previous,
            staff: updatedStaff,
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: queryKeys.user.adminClubs(),
      });
    },
  });
}
