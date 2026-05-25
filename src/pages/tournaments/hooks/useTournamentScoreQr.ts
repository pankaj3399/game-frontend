import { useEffect } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { api, getBackendUrl } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  activeTournamentScoreQrSessionResponseSchema,
  confirmTournamentScoreQrInputSchema,
  confirmTournamentScoreQrResponseSchema,
  generateTournamentScoreQrResponseSchema,
  recordTournamentMatchScoreInputSchema,
  validateTournamentScoreQrConfirmContextResponseSchema,
  validateTournamentScoreQrResponseSchema,
  type ActiveTournamentScoreQrSessionResponse,
  type ConfirmTournamentScoreQrInput,
  type ConfirmTournamentScoreQrResponse,
  type GenerateTournamentScoreQrResponse,
  type RecordTournamentMatchScoreInput,
  type TournamentPlayMode,
  type TournamentScheduleMode,
  type ValidateTournamentScoreQrConfirmContextResponse,
  type ValidateTournamentScoreQrResponse,
} from "@/models/tournament/types";

type GenerateIndependentScoreQrInput = RecordTournamentMatchScoreInput & {
  independentMatchType?: TournamentScheduleMode;
  independentPlayMode?: TournamentPlayMode;
};

/** Opaque cache segment so query keys are not keyed by the raw token string. */
function scoreQrTokenOpaqueKeyPart(token: string): string {
  const s = token.trim();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${s.length}:${(h >>> 0).toString(16)}`;
}

function scoreQrConfirmContextQueryKey(token: string) {
  return [
    ...queryKeys.tournament.all,
    "score-qr",
    "confirm-context",
    scoreQrTokenOpaqueKeyPart(token),
  ] as const;
}

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
  input: GenerateIndependentScoreQrInput,
): Promise<GenerateTournamentScoreQrResponse> {
  const scorePayload = recordTournamentMatchScoreInputSchema.parse(input);
  const payload = {
    ...scorePayload,
    ...(input.independentMatchType
      ? { independentMatchType: input.independentMatchType }
      : {}),
    ...(input.independentPlayMode
      ? { independentPlayMode: input.independentPlayMode }
      : {}),
  };

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

async function validateTournamentScoreQrConfirmContext(
  token: string,
): Promise<ValidateTournamentScoreQrConfirmContextResponse> {
  const safeToken = token.trim();
  if (!safeToken) {
    throw new Error("QR token is required");
  }

  const response = await api.post("/api/tournaments/score-qr/confirm-context", {
    token: safeToken,
  });

  return validateTournamentScoreQrConfirmContextResponseSchema.parse(
    response.data,
  );
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
    mutationFn: (input: GenerateIndependentScoreQrInput) =>
      generateIndependentScoreQr(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournament.liveMatch(),
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.tournament.all, "score-qr", "active"],
          refetchType: "all",
        }),
      ]);
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
      scoreQrTokenOpaqueKeyPart(normalized),
    ] as const,
    queryFn: () => validateTournamentScoreQr(normalized),
    enabled: enabled && normalized.length > 0,
    retry: false,
  });
}

export function useValidateTournamentScoreQrConfirmContext(
  token: string | null | undefined,
  enabled = true,
) {
  const normalized = (token ?? "").trim();

  return useQuery({
    queryKey: scoreQrConfirmContextQueryKey(normalized),
    queryFn: () => validateTournamentScoreQrConfirmContext(normalized),
    enabled: enabled && normalized.length > 0,
    // SSE below pushes updates immediately; this is only a safety net if the stream drops.
    refetchInterval: 30_000,
    retry: false,
  });
}

/** Generator (requester) listens for opponent confirm and score updates on the active QR token. */
export function useScoreQrRequesterSessionEvents(
  token: string | null | undefined,
  enabled = true,
  handlers?: {
    onScoresUpdated?: () => void;
    onRequestConsumed?: () => void;
  },
) {
  const queryClient = useQueryClient();
  const normalized = (token ?? "").trim();
  const onScoresUpdated = handlers?.onScoresUpdated;
  const onRequestConsumed = handlers?.onRequestConsumed;

  useEffect(() => {
    if (!enabled || !normalized || typeof EventSource === "undefined") return;

    const backendUrl = getBackendUrl();
    const url = backendUrl
      ? new URL(
          `/api/tournaments/score-qr/${encodeURIComponent(normalized)}/events`,
          backendUrl,
        ).toString()
      : `/api/tournaments/score-qr/${encodeURIComponent(normalized)}/events`;
    const source = new EventSource(url, { withCredentials: true });

    const refetchActiveSession = () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tournament.all, "score-qr", "active"],
        refetchType: "active",
      });
    };

    const handleScoresUpdated = () => {
      refetchActiveSession();
      onScoresUpdated?.();
    };

    const handleRequestConsumed = () => {
      onRequestConsumed?.();
      refetchActiveSession();
    };

    source.addEventListener("scores-updated", handleScoresUpdated);
    source.addEventListener("request-consumed", handleRequestConsumed);

    return () => {
      source.removeEventListener("scores-updated", handleScoresUpdated);
      source.removeEventListener("request-consumed", handleRequestConsumed);
      source.close();
    };
  }, [enabled, normalized, onRequestConsumed, onScoresUpdated, queryClient]);
}

export function useScoreQrConfirmContextEvents(
  token: string | null | undefined,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const normalized = (token ?? "").trim();

  useEffect(() => {
    if (!enabled || !normalized || typeof EventSource === "undefined") return;

    const backendUrl = getBackendUrl();
    const url = backendUrl
      ? new URL(
          `/api/tournaments/score-qr/${encodeURIComponent(normalized)}/events`,
          backendUrl,
        ).toString()
      : `/api/tournaments/score-qr/${encodeURIComponent(normalized)}/events`;
    const source = new EventSource(url, { withCredentials: true });

    const refetchConfirmContext = () => {
      void queryClient.invalidateQueries({
        queryKey: scoreQrConfirmContextQueryKey(normalized),
        refetchType: "active",
      });
    };

    source.addEventListener("scores-updated", refetchConfirmContext);
    source.addEventListener("request-consumed", refetchConfirmContext);

    return () => {
      source.removeEventListener("scores-updated", refetchConfirmContext);
      source.removeEventListener("request-consumed", refetchConfirmContext);
      source.close();
    };
  }, [enabled, normalized, queryClient]);
}

/** Run after leaving the confirm page so refetches do not trip invalid-confirm UI. */
export async function invalidateQueriesAfterTournamentScoreConfirm(
  queryClient: QueryClient,
  tournamentId: string | null | undefined,
) {
  const invalidations: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({
      queryKey: queryKeys.tournament.liveMatch(),
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.user.myScore(),
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
}

export function useConfirmTournamentScoreQr() {
  return useMutation({
    mutationFn: (input: ConfirmTournamentScoreQrInput) =>
      confirmTournamentScoreQr(input),
  });
}

export function useActiveTournamentScoreQrSession(
  input?: Parameters<typeof getActiveTournamentScoreQrSession>[0],
  enabled = true,
  refetchIntervalMs = 8_000,
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
    // Poll so the generator's page detects when the session is consumed or expired
    // (e.g. opponent confirmed the QR) without requiring a manual refresh.
    refetchInterval: enabled && refetchIntervalMs > 0 ? refetchIntervalMs : false,
    refetchIntervalInBackground: true,
    retry: false,
    // Avoid a brief null session while PATCH/refetch runs (prevents false "opponent confirmed").
    placeholderData: keepPreviousData,
  });
}

// ----------
// Score update (in-place)
// ----------

const scoreQrScoreValueSchema = z.union([z.number(), z.literal("wo"), z.null()]);

async function updateTournamentScoreQrScores(
  requestId: string,
  playerOneScores: Array<number | "wo" | null>,
  playerTwoScores: Array<number | "wo" | null>,
): Promise<{
  requestId: string;
  playerOneScores: Array<number | "wo" | null>;
  playerTwoScores: Array<number | "wo" | null>;
}> {
  const response = await api.patch(
    `/api/tournaments/score-qr/${encodeURIComponent(requestId)}/scores`,
    { playerOneScores, playerTwoScores },
  );
  return z
    .object({
      requestId: z.string(),
      playerOneScores: z.array(scoreQrScoreValueSchema),
      playerTwoScores: z.array(scoreQrScoreValueSchema),
    })
    .parse(response.data);
}

export function useUpdateScoreQrScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      playerOneScores,
      playerTwoScores,
    }: {
      requestId: string;
      playerOneScores: Array<number | "wo" | null>;
      playerTwoScores: Array<number | "wo" | null>;
    }) => updateTournamentScoreQrScores(requestId, playerOneScores, playerTwoScores),
    onSuccess: (data, variables) => {
      // Update cached session scores in-place so the UI does not flash an empty session
      // while a background refetch runs (fast WO ↔ numeric edits used to look "confirmed").
      queryClient.setQueriesData<ActiveTournamentScoreQrSessionResponse>(
        { queryKey: [...queryKeys.tournament.all, "score-qr", "active"] },
        (previous) => {
          if (!previous?.session || previous.session.requestId !== variables.requestId) {
            return previous;
          }
          return {
            ...previous,
            session: {
              ...previous.session,
              playerOneScores: data.playerOneScores,
              playerTwoScores: data.playerTwoScores,
            },
          };
        },
      );
    },
  });
}

export function useCancelActiveScoreQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      // Inline axios import to avoid touching other imports, since we just need a simple call.
      // But we can also use the one from api/tournament.ts
      return import("@/lib/api/tournament").then((m) => m.cancelActiveTournamentScoreQrSession());
    },
    onMutate: () => {
      const previousSessions =
        queryClient.getQueriesData<ActiveTournamentScoreQrSessionResponse>({
          queryKey: [...queryKeys.tournament.all, "score-qr", "active"],
        });
      queryClient.setQueriesData(
        { queryKey: [...queryKeys.tournament.all, "score-qr", "active"] },
        { session: null },
      );
      return { previousSessions };
    },
    onError: (_error, _variables, context) => {
      context?.previousSessions.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.tournament.all, "score-qr", "active"],
        refetchType: "all",
      });
    },
  });
}
