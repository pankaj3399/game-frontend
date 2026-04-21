import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";
import {
  tournamentMatchesResponseSchema,
  type TournamentMatchesResponse,
} from "@/models/tournament/types";

function formatZodIssuesForLog(issues: { readonly path: readonly PropertyKey[]; message: string; code?: string }[]) {
  return issues.map((i) => ({
    path: i.path.map(String).join(".") || "(root)",
    message: i.message,
    code: i.code,
  }));
}

/** Debug preview when Zod rejects the matches response (axios body is typically a plain object). */
function matchesResponseErrorPreview(data: unknown) {
  if (data === null || typeof data !== "object") return null;
  const matches = "matches" in data ? (data as { matches?: unknown }).matches : undefined;
  return {
    hasSchedule: "schedule" in data,
    matchCount: Array.isArray(matches) ? matches.length : null,
  };
}

async function fetchTournamentMatches(id: string): Promise<TournamentMatchesResponse> {
  const response = await api.get(`/api/tournaments/${id}/matches`);
  const raw = response.data;
  const parsed = tournamentMatchesResponseSchema.safeParse(raw);

  if (!parsed.success) {
    const formatted = formatZodIssuesForLog(parsed.error.issues);
    const preview = matchesResponseErrorPreview(raw);

    console.error("[useTournamentMatches] Invalid tournament matches payload (Zod)", {
      tournamentId: id,
      issues: formatted,
      issueCount: parsed.error.issues.length,
      preview,
    });

    const summary = formatted
      .slice(0, 6)
      .map((i) => `${i.path}: ${i.message}`)
      .join("; ");
    throw new Error(
      summary
        ? `Received invalid tournament matches payload from server (${summary})`
        : "Received invalid tournament matches payload from server"
    );
  }

  return parsed.data;
}

export function useTournamentMatches(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.matches(id),
    queryFn: () => {
      if (!id) {
        throw new Error("Tournament id is required");
      }
      return fetchTournamentMatches(id);
    },
    enabled: Boolean(id) && enabled,
    refetchInterval: 60_000,
  });
}
