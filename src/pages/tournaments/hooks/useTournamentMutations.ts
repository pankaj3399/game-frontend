import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import { toBackendCreateInput, toBackendUpdateInput } from "./mappers";
import {
  createTournamentResponseSchema,
  joinTournamentResponseSchema,
  publishTournamentPayloadSchema,
  publishTournamentResponseSchema,
  updateTournamentResponseSchema,
  type CreateTournamentInput,
  type CreateTournamentResponse,
  type JoinTournamentResponse,
  type PublishTournamentPayload,
  type UpdateTournamentInput,
  type UpdateTournamentResponse,
} from "@/models/tournament/types";

async function createTournament(data: CreateTournamentInput): Promise<CreateTournamentResponse> {
  const payload = toBackendCreateInput(data);
  const res = await api.post("/api/tournaments", payload);
  return createTournamentResponseSchema.parse(res.data);
}

async function updateTournament(id: string, data: UpdateTournamentInput): Promise<UpdateTournamentResponse> {
  const payload = toBackendUpdateInput(data);
  const res = await api.patch(`/api/tournaments/${id}`, payload);
  return updateTournamentResponseSchema.parse(res.data);
}

async function publishTournament(id: string, data: PublishTournamentPayload = {}) {
  const parsed = publishTournamentPayloadSchema.parse(data);
  const payload = toBackendUpdateInput(parsed);
  const res = await api.post(`/api/tournaments/${id}/publish`, payload);
  return publishTournamentResponseSchema.parse(res.data);
}

async function joinTournament(id: string): Promise<JoinTournamentResponse> {
  const res = await api.post(`/api/tournaments/${id}/join`);
  return joinTournamentResponseSchema.parse(res.data);
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
