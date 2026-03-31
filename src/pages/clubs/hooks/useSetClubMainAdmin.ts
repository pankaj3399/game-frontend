import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  ClubStaffMember,
  ClubStaffResponse,
} from "@/pages/clubs/hooks/useClubStaff";

interface SetClubMainAdminInput {
  clubId: string;
  userId: string;
  orderedIds?: string[];
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

function applyMainAdminAssignment(
  staff: ClubStaffMember[],
  userId: string,
  mainAdminLabel = "Main Admin",
): ClubStaffMember[] {
  return staff.map((member) => {
    if (member.id === userId) {
      return {
        ...member,
        role: "default_admin",
        roleLabel: mainAdminLabel,
      };
    }

    return toAdminIfDefault(member);
  });
}

function toAdminIfDefault(member: ClubStaffMember): ClubStaffMember {
  if (member.role !== "default_admin") {
    return member;
  }

  return {
    ...member,
    role: "admin",
    roleLabel: "Admin",
  };
}

function reorderStaff(
  staff: ClubStaffMember[],
  orderedIds: string[] | undefined,
): ClubStaffMember[] {
  if (!orderedIds || orderedIds.length === 0) {
    return staff;
  }

  const byId = new Map(staff.map((member) => [member.id, member]));
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((member): member is ClubStaffMember => member !== undefined);

  const orderedSet = new Set(ordered.map((member) => member.id));
  for (const member of staff) {
    if (!orderedSet.has(member.id)) {
      ordered.push(member);
    }
  }

  return ordered;
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
    onMutate: async (variables) => {
      const key = queryKeys.club.staff(variables.clubId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ClubStaffResponse>(key);
      if (!previous) {
        return { previous, key };
      }

      const orderedStaff = reorderStaff(previous.staff, variables.orderedIds);
      const nextStaff = applyMainAdminAssignment(orderedStaff, variables.userId);

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
    onSuccess: (data, variables) => {
      const key = queryKeys.club.staff(variables.clubId);
      const current = queryClient.getQueryData<ClubStaffResponse>(key);
      if (!current) {
        return;
      }

      const nextStaff = applyMainAdminAssignment(
        current.staff,
        data.staff.id,
        data.staff.roleLabel,
      );

      queryClient.setQueryData<ClubStaffResponse>(key, {
        ...current,
        staff: nextStaff,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user.adminClubs(),
      });
    },
  });
}
