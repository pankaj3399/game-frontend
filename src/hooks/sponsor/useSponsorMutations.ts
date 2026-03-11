import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { requireClubId } from "./helpers";
export interface CreateSponsorInput {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  link?: string | null;
}

export interface UpdateSponsorInput {
  name?: string;
  description?: string | null;
  logoUrl?: string;
  link?: string;
  status?: "active" | "paused";
}

async function createSponsor(clubId: string, input: CreateSponsorInput) {
  const res = await api.post(`/api/clubs/${clubId}/sponsors`, input);
  return res.data;
}

async function updateSponsor(
  clubId: string,
  sponsorId: string,
  input: UpdateSponsorInput
) {
  const res = await api.patch(
    `/api/clubs/${clubId}/sponsors/${sponsorId}`,
    input
  );
  return res.data;
}

async function deleteSponsor(clubId: string, sponsorId: string) {
  await api.delete(`/api/clubs/${clubId}/sponsors/${sponsorId}`);
}

export function useCreateSponsor(clubId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSponsorInput) =>
      createSponsor(requireClubId(clubId), input),
    onSuccess: () => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
        queryClient.invalidateQueries({ queryKey: ["sponsors", "all"] });
      }
    },
  });
}

export function useUpdateSponsor(clubId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sponsorId,
      input,
    }: {
      sponsorId: string;
      input: UpdateSponsorInput;
    }) => updateSponsor(requireClubId(clubId), sponsorId, input),
    onSuccess: () => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
        queryClient.invalidateQueries({ queryKey: ["sponsors", "all"] });
      }
    },
  });
}

export function useDeleteSponsor(clubId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sponsorId: string) => deleteSponsor(requireClubId(clubId), sponsorId),
    onSuccess: () => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
        queryClient.invalidateQueries({ queryKey: ["sponsors", "all"] });
      }
    },
  });
}
