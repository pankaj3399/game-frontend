import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  generateTournamentDoublesPairsInputSchema,
  generateTournamentDoublesPairsResponseSchema,
  generateTournamentScheduleInputSchema,
  generateTournamentScheduleResponseSchema,
  saveTournamentDoublesPairsInputSchema,
  saveTournamentDoublesPairsResponseSchema,
  tournamentDoublesPairsResponseSchema,
  cancelTournamentScheduleRoundResponseSchema,
  tournamentScheduleResponseSchema,
  type CancelTournamentScheduleRoundResponse,
  type GenerateTournamentDoublesPairsInput,
  type GenerateTournamentDoublesPairsResponse,
  type GenerateTournamentScheduleInput,
  type GenerateTournamentScheduleResponse,
  type SaveTournamentDoublesPairsInput,
  type SaveTournamentDoublesPairsResponse,
  type TournamentDoublesPairsResponse,
  type TournamentScheduleResponse,
} from "@/models/tournament/types";

async function fetchTournamentSchedule(
  id: string,
  round?: number
): Promise<TournamentScheduleResponse> {
  const response = await api.get(`/api/schedule/${id}`, {
    params: round != null && round >= 1 ? { round } : undefined,
  });
  return tournamentScheduleResponseSchema.parse(response.data);
}

async function generateTournamentSchedule(
  id: string,
  payload: GenerateTournamentScheduleInput
): Promise<GenerateTournamentScheduleResponse> {
  const parsedPayload = generateTournamentScheduleInputSchema.parse(payload);
  const response = await api.post(`/api/schedule/${id}`, parsedPayload);
  return generateTournamentScheduleResponseSchema.parse(response.data);
}

async function generateDoublesPairs(
  id: string,
  payload: GenerateTournamentDoublesPairsInput
): Promise<GenerateTournamentDoublesPairsResponse> {
  const parsedPayload = generateTournamentDoublesPairsInputSchema.parse(payload);
  const response = await api.post(`/api/schedule/${id}/pairs`, parsedPayload);
  return generateTournamentDoublesPairsResponseSchema.parse(response.data);
}

async function cancelScheduleRound(
  id: string,
  round: number
): Promise<CancelTournamentScheduleRoundResponse> {
  const response = await api.delete(`/api/schedule/${id}/round/${round}`);
  return cancelTournamentScheduleRoundResponseSchema.parse(response.data);
}

async function fetchDoublesPairs(id: string): Promise<TournamentDoublesPairsResponse> {
  const response = await api.get(`/api/tournaments/${id}/doubles-pairs`);
  return tournamentDoublesPairsResponseSchema.parse(response.data);
}

async function saveDoublesPairs(
  id: string,
  payload: SaveTournamentDoublesPairsInput
): Promise<SaveTournamentDoublesPairsResponse> {
  const parsedPayload = saveTournamentDoublesPairsInputSchema.parse(payload);
  const response = await api.put(`/api/tournaments/${id}/doubles-pairs`, parsedPayload);
  return saveTournamentDoublesPairsResponseSchema.parse(response.data);
}

export function useTournamentSchedule(
  id: string | null,
  enabled = true,
  round?: number | null
) {
  const scheduleRound =
    round != null && Number.isFinite(round) && round >= 1 ? Math.trunc(round) : null;

  return useQuery({
    queryKey: [...queryKeys.tournament.schedule(id), scheduleRound] as const,
    queryFn: () => {
      if (!id) {
        throw new Error("Tournament id is required");
      }
      return fetchTournamentSchedule(id, scheduleRound ?? undefined);
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useDoublesPairs(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.doublesPairs(id),
    queryFn: () => {
      if (!id) {
        throw new Error("Tournament id is required");
      }
      return fetchDoublesPairs(id);
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useGenerateTournamentSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GenerateTournamentScheduleInput }) =>
      generateTournamentSchedule(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.schedule(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.matches(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.detail(variables.id) });
    },
  });
}

export function useGenerateTournamentDoublesPairs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GenerateTournamentDoublesPairsInput }) =>
      generateDoublesPairs(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.schedule(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.matches(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.detail(variables.id) });
    },
  });
}

export function useSaveDoublesPairs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveTournamentDoublesPairsInput }) =>
      saveDoublesPairs(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.doublesPairs(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.schedule(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.matches(variables.id) });
    },
  });
}

export function useCancelTournamentScheduleRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, round }: { id: string; round: number }) =>
      cancelScheduleRound(id, round),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.schedule(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.matches(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournament.detail(variables.id) });
    },
  });
}
