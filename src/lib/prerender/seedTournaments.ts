import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import type { TournamentsResponse } from "@/models/tournament/types";

type PrerenderPayload = TournamentsResponse & {
  filters?: {
    page?: number;
    limit?: number;
    when?: "future" | "past";
  };
  /** Epoch ms when the build-time fetch completed (informational only). */
  generatedAt?: number;
};

declare global {
  interface Window {
    __TB10_PRERENDER__?: PrerenderPayload;
  }
}

/** Default guest list filters used by the build-time prerender script. */
export const PRERENDER_TOURNAMENT_FILTERS = {
  page: 1,
  limit: 10,
  when: "future" as const,
};

let prerenderTournamentSeedApplied = false;

/** True when build-time list data was written into the Query cache this page load. */
export function didSeedPrerenderedTournaments(): boolean {
  return prerenderTournamentSeedApplied;
}

/**
 * Seed TanStack Query from build-time prerender data so /tournaments skips
 * the cold network round-trip when filters still match the default guest list.
 */
export function seedPrerenderedTournaments(queryClient: QueryClient): void {
  if (typeof window === "undefined") return;
  const payload = window.__TB10_PRERENDER__;
  if (!payload?.tournaments || !Array.isArray(payload.tournaments)) return;

  const filters = {
    page: payload.filters?.page ?? PRERENDER_TOURNAMENT_FILTERS.page,
    limit: payload.filters?.limit ?? PRERENDER_TOURNAMENT_FILTERS.limit,
    when: payload.filters?.when ?? PRERENDER_TOURNAMENT_FILTERS.when,
  };

  const data = {
    tournaments: payload.tournaments,
    pagination: payload.pagination ?? {
      total: payload.tournaments.length,
      page: filters.page,
      limit: filters.limit,
      totalPages: 1,
    },
  };

  const now = Date.now();
  // Mark fresh at hydration time — never use build-time `generatedAt` here
  // (it is almost always older than staleTime and forces an immediate refetch).
  queryClient.setQueryData(queryKeys.tournament.list(filters), data, {
    updatedAt: now,
  });
  // Organisers add `view: "published"` to the key after auth — seed that too.
  queryClient.setQueryData(
    queryKeys.tournament.list({ ...filters, view: "published" }),
    data,
    { updatedAt: now },
  );

  prerenderTournamentSeedApplied = true;

  // One-shot: avoid re-seeding on HMR / remounts with stale build data.
  try {
    delete window.__TB10_PRERENDER__;
  } catch {
    /* ignore */
  }
}
