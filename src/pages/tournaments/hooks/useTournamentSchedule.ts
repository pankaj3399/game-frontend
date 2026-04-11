import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  generateTournamentDoublesPairsInputSchema,
  generateTournamentDoublesPairsResponseSchema,
  generateTournamentScheduleInputSchema,
  generateTournamentScheduleResponseSchema,
  tournamentScheduleResponseSchema,
  type GenerateTournamentDoublesPairsInput,
  type GenerateTournamentDoublesPairsResponse,
  type GenerateTournamentScheduleInput,
  type GenerateTournamentScheduleResponse,
  type TournamentScheduleResponse,
} from "@/models/tournament/types";

async function fetchTournamentSchedule(id: string): Promise<TournamentScheduleResponse> {
  const response = await api.get(`/api/schedule/${id}`);
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

export function useTournamentSchedule(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.schedule(id),
    queryFn: () => {
      if (!id) {
        throw new Error("Tournament id is required");
      }
      return fetchTournamentSchedule(id);
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
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GenerateTournamentDoublesPairsInput }) =>
      generateDoublesPairs(id, payload),
  });
}
