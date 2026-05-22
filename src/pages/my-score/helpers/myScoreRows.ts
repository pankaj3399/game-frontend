import type { MyScoreEntry } from "@/models/myScore/types";
import type { TournamentLiveMatchItem } from "@/models/tournament/types";

export type MyScoreDisplayRow =
  | { kind: "scheduled"; match: TournamentLiveMatchItem }
  | { kind: "entry"; entry: MyScoreEntry };

export function buildMyScoreDisplayRows(
  entries: MyScoreEntry[],
  scheduledMatches: TournamentLiveMatchItem[],
  page: number,
): MyScoreDisplayRow[] {
  const scheduledRows: MyScoreDisplayRow[] =
    page === 1
      ? scheduledMatches.map((match) => ({ kind: "scheduled", match }))
      : [];

  const entryRows: MyScoreDisplayRow[] = entries.map((entry) => ({
    kind: "entry",
    entry,
  }));

  return [...scheduledRows, ...entryRows];
}
