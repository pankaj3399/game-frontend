import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import type { TournamentDetail } from "@/hooks/tournament";
import { TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface ResultsTabProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
}

interface ParticipantResult {
  id: string;
  name: string;
  wins: number;
  totalScoreAdvantage: number;
  positionChange: number; // positive = up, negative = down, 0 = no change
}

function participantDisplayName(name: string | null, alias: string | null, fallback: string) {
  return name || alias || fallback;
}

/**
 * Derives results from participants. When the backend provides match results,
 * replace this with API data. For now uses deterministic placeholder values.
 */
function deriveResults(
  tournament: TournamentDetail,
  unknownLabel: string
): ParticipantResult[] {
  const participants = tournament.participants;
  if (participants.length === 0) return [];

  // Sort by a deterministic "score" (wins * 10 + scoreAdvantage) for display.
  // Uses participant index as seed for variety until real match data exists.
  const withScores = participants.map((p, idx) => {
    const wins = (idx * 3 + 1) % 9; // 1-8 range for variety
    const totalScoreAdvantage = (idx * 5 + 7) % 30 + 5; // 5-34 range
    const positionChange = idx % 5 === 0 ? 2 : idx % 5 === 1 ? -1 : 0;
    return {
      id: p.id,
      name: participantDisplayName(p.name, p.alias, unknownLabel),
      wins,
      totalScoreAdvantage,
      positionChange,
    };
  });

  // Sort by wins desc, then by totalScoreAdvantage desc
  return withScores.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalScoreAdvantage - a.totalScoreAdvantage;
  });
}

function PositionChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-medium text-[#15803d]">
        <ChevronUp className="size-4" aria-hidden />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-medium text-[#dc2626]">
        <ChevronDown className="size-4" aria-hidden />
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-[#9ca3af]">
      <Minus className="size-4" aria-hidden />
      0
    </span>
  );
}

export function ResultsTab({ tournament, currentUserId }: ResultsTabProps) {
  const { t } = useTranslation();
  const [myScoreOnly, setMyScoreOnly] = useState(false);

  const results = deriveResults(tournament, t("tournaments.unknownPlayer"));

  // Compute filteredResults as a value, not a function, and give correct type
  const filteredResults = (!myScoreOnly || !currentUserId)
    ? results
    : results.filter((r) => r.id === currentUserId);

  const isCurrentUser = (id: string) => !!currentUserId && id === currentUserId;

  return (
    <TabsContent value="results" className="mt-6">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-[#111827]">
            {t("tournaments.allResults")}
          </h2>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[#374151]">
            <span>{t("settings.nav.myScore")}</span>
            <Switch
              checked={myScoreOnly}
              onCheckedChange={setMyScoreOnly}
              aria-label={t("settings.nav.myScore")}
            />
          </div>
        </div>

        {results.length === 0 ? (
          <p className="mt-6 text-sm text-[#6b7280]">{t("tournaments.noResultsYet")}</p>
        ) : filteredResults.length === 0 ? (
          <p className="mt-6 text-sm text-[#6b7280]">
            {t("tournaments.noMyResults")}
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[400px] border-collapse">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                    {t("tournaments.resultsPosition")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                    {t("tournaments.resultsPlayers")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                    {t("tournaments.resultsWins")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                    {t("tournaments.resultsTotalScoreAdvantage")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((row, idx) => {
                  const position = myScoreOnly
                    ? results.findIndex((r) => r.id === row.id) + 1
                    : idx + 1;
                  const isHighlighted = isCurrentUser(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-[#e5e7eb] transition-colors ${
                        isHighlighted ? "bg-[#f0fdf4]" : "hover:bg-[#f9fafb]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#111827]">
                            {position}
                          </span>
                          <PositionChangeIndicator change={row.positionChange} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#111827]">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#374151]">
                        {row.wins}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#374151]">
                        {row.totalScoreAdvantage}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
