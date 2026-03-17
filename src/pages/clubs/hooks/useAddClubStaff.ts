import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

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
    role: string;
    roleLabel: string;
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.club.staff(variables.clubId),
      });
    },
  });
}
