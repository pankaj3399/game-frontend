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
  const res = await api.post(`/api/sponsors/clubs/${clubId}`, input);
  return res.data;
}

async function updateSponsor(
  clubId: string,
  sponsorId: string,
  input: UpdateSponsorInput
) {
  const res = await api.patch(
    `/api/sponsors/clubs/${clubId}/${sponsorId}`,
    input
  );
  return res.data;
}

async function deleteSponsor(clubId: string, sponsorId: string) {
  await api.delete(`/api/sponsors/clubs/${clubId}/${sponsorId}`);
}

function invalidateTournamentDetailQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ["tournament", "detail"] });
}

export function useCreateSponsor(clubId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSponsorInput) => {
      const data = await createSponsor(requireClubId(clubId), input);
      return data;
    },
    onSuccess: () => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sponsors.all });
        invalidateTournamentDetailQueries(queryClient);
      }
    },
  });
}

export function useUpdateSponsor(clubId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sponsorId,
      input,
    }: {
      sponsorId: string;
      input: UpdateSponsorInput;
    }) => {
      const data = await updateSponsor(requireClubId(clubId), sponsorId, input);
      return data;
    },
    onSuccess: () => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sponsors.all });
        invalidateTournamentDetailQueries(queryClient);
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
        queryClient.invalidateQueries({ queryKey: queryKeys.sponsors.all });
        invalidateTournamentDetailQueries(queryClient);
      }
    },
  });
}
