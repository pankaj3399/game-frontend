import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  activeTournamentScoreQrSessionResponseSchema,
  confirmTournamentScoreQrInputSchema,
  confirmTournamentScoreQrResponseSchema,
  generateTournamentScoreQrResponseSchema,
  recordTournamentMatchScoreInputSchema,
  validateTournamentScoreQrResponseSchema,
  type ActiveTournamentScoreQrSessionResponse,
  type ConfirmTournamentScoreQrInput,
  type ConfirmTournamentScoreQrResponse,
  type GenerateTournamentScoreQrResponse,
  type RecordTournamentMatchScoreInput,
  type TournamentPlayMode,
  type TournamentScheduleMode,
  type ValidateTournamentScoreQrResponse,
} from "@/models/tournament/types";

// Backward-compatible schema: tolerate missing `request` in validate response.
const validateTournamentScoreQrResponseLooseSchema =
  validateTournamentScoreQrResponseSchema.or(
    z.object({
      message: z.string(),
      valid: z.boolean(),
      reason: z.string(),
    }),
  );

// --------------------
// API functions
// --------------------

async function generateTournamentScoreQr(
  tournamentId: string,
  matchId: string,
  input: RecordTournamentMatchScoreInput,
): Promise<GenerateTournamentScoreQrResponse> {
  const payload = recordTournamentMatchScoreInputSchema.parse(input);

  const response = await api.post(
    `/api/tournaments/${tournamentId}/matches/${matchId}/score/qr`,
    payload,
  );

  return generateTournamentScoreQrResponseSchema.parse(response.data);
}

async function generateIndependentScoreQr(
  input: RecordTournamentMatchScoreInput,
): Promise<GenerateTournamentScoreQrResponse> {
  const payload = recordTournamentMatchScoreInputSchema.parse(input);

  const response = await api.post(
    "/api/tournaments/score-qr/independent",
    payload,
  );

  return generateTournamentScoreQrResponseSchema.parse(response.data);
}

async function validateTournamentScoreQr(
  token: string,
): Promise<ValidateTournamentScoreQrResponse> {
  const safeToken = token.trim();
  if (!safeToken) {
    throw new Error("QR token is required");
  }

  const response = await api.get(
    `/api/tournaments/score-qr/${encodeURIComponent(safeToken)}`,
  );

  const parsed = validateTournamentScoreQrResponseLooseSchema.parse(
    response.data,
  );

  // Normalize to the strict shared type shape.
  if (!("request" in parsed)) {
    return {
      message: parsed.message,
      valid: parsed.valid,
      reason: parsed.reason,
      request: null,
    };
  }

  return parsed;
}

async function confirmTournamentScoreQr(
  input: ConfirmTournamentScoreQrInput,
): Promise<ConfirmTournamentScoreQrResponse> {
  const payload = confirmTournamentScoreQrInputSchema.parse(input);

  const response = await api.post("/api/tournaments/score-qr/confirm", payload);

  return confirmTournamentScoreQrResponseSchema.parse(response.data);
}

async function getActiveTournamentScoreQrSession(input?: {
  flow?: "tournament" | "independent";
  tournamentId?: string | null;
  matchId?: string | null;
  playMode?: TournamentPlayMode;
  matchType?: TournamentScheduleMode;
}): Promise<ActiveTournamentScoreQrSessionResponse> {
  const params = new URLSearchParams();
  if (input?.flow) params.set("flow", input.flow);
  if (input?.tournamentId) params.set("tournamentId", input.tournamentId);
  if (input?.matchId) params.set("matchId", input.matchId);
  if (input?.playMode) params.set("playMode", input.playMode);
  if (input?.matchType) params.set("matchType", input.matchType);

  const queryString = params.toString();
  const response = await api.get(
    `/api/tournaments/score-qr/active${queryString ? `?${queryString}` : ""}`,
  );

  return activeTournamentScoreQrSessionResponseSchema.parse(response.data);
}

// --------------------
// Hooks
// --------------------

export function useGenerateTournamentScoreQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tournamentId,
      matchId,
      input,
    }: {
      tournamentId: string;
      matchId: string;
      input: RecordTournamentMatchScoreInput;
    }) => generateTournamentScoreQr(tournamentId, matchId, input),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournament.liveMatch(),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournament.matches(variables.tournamentId),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournament.detail(variables.tournamentId),
          refetchType: "all",
        }),
      ]);
    },
  });
}

export function useGenerateIndependentScoreQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordTournamentMatchScoreInput) =>
      generateIndependentScoreQr(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tournament.liveMatch(),
        refetchType: "all",
      });
    },
  });
}

export function useValidateTournamentScoreQr(
  token: string | null | undefined,
  enabled = true,
) {
  const normalized = (token ?? "").trim();

  return useQuery({
    queryKey: [
      ...queryKeys.tournament.all,
      "score-qr",
      "validate",
      normalized,
    ] as const,
    queryFn: () => validateTournamentScoreQr(normalized),
    enabled: enabled && normalized.length > 0,
    staleTime: 15_000,
    retry: false,
  });
}

export function useConfirmTournamentScoreQr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ConfirmTournamentScoreQrInput) =>
      confirmTournamentScoreQr(input),
    onSuccess: async (response) => {
      const tournamentId = response.match.tournamentId;

      const invalidations: Array<Promise<unknown>> = [
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournament.liveMatch(),
          refetchType: "all",
        }),
      ];

      if (tournamentId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: queryKeys.tournament.matches(tournamentId),
            refetchType: "all",
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.tournament.detail(tournamentId),
            refetchType: "all",
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.tournament.schedule(tournamentId),
            refetchType: "all",
          }),
        );
      }

      await Promise.all(invalidations);
    },
  });
}

export function useActiveTournamentScoreQrSession(
  input?: Parameters<typeof getActiveTournamentScoreQrSession>[0],
  enabled = true,
) {
  const normalized = {
    flow: input?.flow ?? null,
    tournamentId: input?.tournamentId ?? null,
    matchId: input?.matchId ?? null,
    playMode: input?.playMode ?? null,
    matchType: input?.matchType ?? null,
  } as const;

  return useQuery({
    queryKey: [
      ...queryKeys.tournament.all,
      "score-qr",
      "active",
      normalized,
    ] as const,
    queryFn: () => getActiveTournamentScoreQrSession(input),
    enabled,
    staleTime: 10_000,
    retry: false,
  });
}
