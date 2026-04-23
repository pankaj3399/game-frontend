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

export function useCreateSponsor(clubId: string | null) {
  const queryClient = useQueryClient();
  const invalidateTournamentDetailQueries = () =>
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key[0] === "tournament" && key[1] === "detail";
      },
    });

  return useMutation({
    mutationFn: async (input: CreateSponsorInput) => {
      const data = await createSponsor(requireClubId(clubId), input);
      return data;
    },
    onSuccess: () => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sponsors.all });
        invalidateTournamentDetailQueries();
      }
    },
  });
}

export function useUpdateSponsor(clubId: string | null) {
  const queryClient = useQueryClient();
  const invalidateTournamentDetailQueries = () =>
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key[0] === "tournament" && key[1] === "detail";
      },
    });

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
        invalidateTournamentDetailQueries();
      }
    },
  });
}

export function useDeleteSponsor(clubId: string | null) {
  const queryClient = useQueryClient();
  const invalidateTournamentDetailQueries = () =>
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key[0] === "tournament" && key[1] === "detail";
      },
    });

  return useMutation({
    mutationFn: (sponsorId: string) => deleteSponsor(requireClubId(clubId), sponsorId),
    onSuccess: () => {
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.club.sponsors(clubId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sponsors.all });
        invalidateTournamentDetailQueries();
      }
    },
  });
}
