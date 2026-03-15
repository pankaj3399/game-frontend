import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

interface TournamentInputBase {
  sponsorId?: string | null;
  logo?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  playMode?: string;
  tournamentMode?: string;
  externalFee?: number;
  minMember?: number;
  maxMember?: number;
  playTime?: string | null;
  pauseTime?: string | null;
  courts?: string[];
  foodInfo?: string | null;
  descriptionInfo?: string | null;
  numberOfRounds?: number;
  roundTimings?: { startDate?: string; endDate?: string }[];
}

export interface CreateTournamentInput extends TournamentInputBase {
  club: string;
  name: string;
  status: "draft" | "active";
}

export type UpdateTournamentInput = Partial<TournamentInputBase & { club: string; name: string }>;

/** Minimal payload for publish endpoint; no body fields required. */
export type PublishTournamentPayload = Record<string, never>;

interface CreateTournamentResponse {
  message: string;
  tournament: { id: string; name: string; club: string; status: string; date?: string; createdAt?: string };
}

interface UpdateTournamentResponse {
  message: string;
  tournament: { id: string; name: string; club: string; status: string; date?: string; updatedAt?: string };
}

interface PublishTournamentResponse {
  message: string;
  tournament: { id: string; name: string; club: string; status: string };
}

interface JoinTournamentResponse {
  message: string;
  tournament: { id: string; spotsFilled: number; spotsTotal: number; isParticipant: boolean };
}

async function createTournament(data: CreateTournamentInput): Promise<CreateTournamentResponse> {
  const res = await api.post<CreateTournamentResponse>("/api/tournaments", data);
  return res.data;
}

async function updateTournament(id: string, data: UpdateTournamentInput): Promise<UpdateTournamentResponse> {
  const res = await api.patch<UpdateTournamentResponse>(`/api/tournaments/${id}`, data);
  return res.data;
}

async function publishTournament(id: string, _data?: PublishTournamentPayload) {
  const res = await api.post<PublishTournamentResponse>(`/api/tournaments/${id}/publish`, {});
  return res.data;
}

async function joinTournament(id: string): Promise<JoinTournamentResponse> {
  const res = await api.post<JoinTournamentResponse>(`/api/tournaments/${id}/join`);
  return res.data;
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.all });
    },
  });
}

export function useUpdateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTournamentInput }) => updateTournament(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.detail(id) });
    },
  });
}

export function usePublishTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: PublishTournamentPayload }) => publishTournament(id, data ?? {}),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.detail(id) });
    },
  });
}

export function useJoinTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => joinTournament(id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.all });
    },
  });
}
