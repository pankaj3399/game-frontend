import type { TournamentScheduleMatch } from "@/models/tournament/types";

export function isRoundResolvedStatus(status: TournamentScheduleMatch["status"]): boolean {
  return status === "completed" || status === "cancelled";
}
