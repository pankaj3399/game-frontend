import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export type CourtType =
  | "concrete"
  | "clay"
  | "hard"
  | "grass"
  | "carpet"
  | "other";
export type CourtPlacement = "indoor" | "outdoor";

export interface CourtInput {
  id?: string;
  name: string;
  type: CourtType;
  placement: CourtPlacement;
}

export interface CreateClubInput {
  name: string;
  website?: string | null;
  bookingSystemUrl?: string | null;
  address: string;
  /** [longitude, latitude] - required for club creation */
  coordinates: [number, number];
  courts?: CourtInput[];
}

export interface UpdateClubInput {
  name?: string;
  website?: string | null;
  bookingSystemUrl?: string | null;
  address?: string;
  coordinates?: [number, number];
  courts?: CourtInput[];
}

interface ClubResponse {
  club: {
    id: string;
    name: string;
    address?: string;
    website?: string | null;
    bookingSystemUrl?: string | null;
    courtCount: number;
  };
}

interface ClubDetailResponse {
  club: {
    id: string;
    name: string;
    address: string;
    website: string | null;
    bookingSystemUrl: string | null;
    coordinates: [number, number] | null;
  };
  courts: Array<{
    id: string;
    name: string;
    type: string;
    placement: string;
  }>;
}

async function createClub(data: CreateClubInput): Promise<ClubResponse> {
  const res = await api.post<ClubResponse>("/api/clubs", data);
  return res.data;
}

async function updateClub(
  clubId: string,
  data: UpdateClubInput
): Promise<ClubResponse> {
  const res = await api.patch<ClubResponse>(`/api/clubs/${clubId}`, data);
  return res.data;
}

async function fetchClubById(clubId: string): Promise<ClubDetailResponse> {
  const res = await api.get<ClubDetailResponse>(`/api/clubs/${clubId}`);
  return res.data;
}

export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.adminClubs() });
    },
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId: id, data }: { clubId: string; data: UpdateClubInput }) =>
      updateClub(id, data),
    onSuccess: (_, { clubId: id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.adminClubs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.club.detail(id) });
    },
  });
}

export function useClubById(clubId: string | null) {
  return useQuery({
    queryKey: queryKeys.club.detail(clubId ?? ""),
    queryFn: () => fetchClubById(clubId!),
    enabled: !!clubId,
  });
}
