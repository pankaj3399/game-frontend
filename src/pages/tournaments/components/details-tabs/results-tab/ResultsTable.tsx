import type { TFunction } from "i18next";
import type { ParticipantResult } from "./types";
import { PositionChangeIndicator } from "./PositionChangeIndicator";

interface ResultsTableProps {
  allResults: ParticipantResult[];
  filteredResults: ParticipantResult[];
  myScoreOnly: boolean;
  currentUserId: string | null;
  t: TFunction;
}

export function ResultsTable({
  allResults,
  filteredResults,
  myScoreOnly,
  currentUserId,
  t,
}: ResultsTableProps) {
  const isCurrentUser = (id: string) => Boolean(currentUserId && id === currentUserId);

  return (
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
          {filteredResults.map((row, index) => {
            const idx = allResults.findIndex((result) => result.id === row.id);
            const position = myScoreOnly ? (idx >= 0 ? idx + 1 : index + 1) : index + 1;
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
                    <span className="text-sm font-semibold text-[#111827]">{position}</span>
                    <PositionChangeIndicator change={row.positionChange} />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-[#111827]">{row.name}</td>
                <td className="px-4 py-3 text-sm text-[#374151]">{row.wins}</td>
                <td className="px-4 py-3 text-sm text-[#374151]">{row.totalScoreAdvantage}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
