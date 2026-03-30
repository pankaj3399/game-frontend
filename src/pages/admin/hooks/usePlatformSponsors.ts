import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export interface PlatformSponsor {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  link: string | null;
  status: "active" | "paused";
}

export interface UpsertPlatformSponsorInput {
  name: string;
  logoUrl?: string | null;
  link?: string | null;
}

interface PlatformSponsorsResponse {
  sponsors: PlatformSponsor[];
}

async function fetchPlatformSponsors(): Promise<PlatformSponsorsResponse> {
  const res = await api.get<PlatformSponsorsResponse>("/api/admin/sponsors");
  return res.data;
}

async function createPlatformSponsor(input: UpsertPlatformSponsorInput) {
  const res = await api.post<PlatformSponsor>("/api/admin/sponsors", input);
  return res.data;
}

async function updatePlatformSponsor(sponsorId: string, input: UpsertPlatformSponsorInput) {
  const res = await api.patch<PlatformSponsor>(`/api/admin/sponsors/${sponsorId}`, input);
  return res.data;
}

async function deletePlatformSponsor(sponsorId: string) {
  await api.delete(`/api/admin/sponsors/${sponsorId}`);
}

function useInvalidatePlatformSponsors() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.platformSponsors() });
    queryClient.invalidateQueries({ queryKey: queryKeys.sponsors.all });
  };
}

export function usePlatformSponsors(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.admin.platformSponsors(),
    queryFn: fetchPlatformSponsors,
    enabled,
  });
}

export function useCreatePlatformSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertPlatformSponsorInput) => {
      const data = await createPlatformSponsor(input);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.platformSponsors() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sponsors.all });
      return data;
    },
  });
}

export function useUpdatePlatformSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sponsorId,
      input,
    }: {
      sponsorId: string;
      input: UpsertPlatformSponsorInput;
    }) => {
      const data = await updatePlatformSponsor(sponsorId, input);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.platformSponsors() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sponsors.all });
      return data;
    },
  });
}

export function useDeletePlatformSponsor() {
  const invalidate = useInvalidatePlatformSponsors();

  return useMutation({
    mutationFn: (sponsorId: string) => deletePlatformSponsor(sponsorId),
    onSuccess: invalidate,
  });
}
