import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

interface SetClubMainAdminInput {
  clubId: string;
  userId: string;
}

interface SetClubMainAdminResponse {
  message: string;
  staff: {
    id: string;
    email: string;
    name: string | null;
    alias: string | null;
    role: "default_admin";
    roleLabel: string;
  };
}

async function setClubMainAdmin({
  clubId,
  userId,
}: SetClubMainAdminInput): Promise<SetClubMainAdminResponse> {
  const res = await api.patch<SetClubMainAdminResponse>(
    `/api/clubs/${clubId}/staff/main-admin`,
    { userId }
  );

  return res.data;
}

export function useSetClubMainAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setClubMainAdmin,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.club.staff(variables.clubId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.adminClubs(),
      });
    },
  });
}
