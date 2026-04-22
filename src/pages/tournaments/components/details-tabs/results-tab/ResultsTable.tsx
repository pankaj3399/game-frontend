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

const AVATAR_TONES = [
  "from-[#f7d4bf] to-[#efb598]",
  "from-[#d5e5f6] to-[#acc8e7]",
  "from-[#d9efdd] to-[#b9dfc4]",
  "from-[#f7e5bb] to-[#efd587]",
  "from-[#e8ddfb] to-[#cab6ef]",
  "from-[#ffd8e0] to-[#f4b3c2]",
];

function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0;
  }
  return (hash >>> 0) % 2147483647;
}

function initialsFromName(name: string): string {
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "?";
  }

  const first = tokens[0][0] ?? "";
  const second = tokens.length > 1 ? tokens[tokens.length - 1][0] ?? "" : "";
  return `${first}${second}`.toUpperCase();
}

function participantToneClass(participant: ParticipantResult): string {
  const seed = hashSeed(`${participant.id}:${participant.name}`);
  return AVATAR_TONES[seed % AVATAR_TONES.length] ?? AVATAR_TONES[0];
}

export function ResultsTable({
  allResults,
  filteredResults,
  myScoreOnly,
  currentUserId,
  t,
}: ResultsTableProps) {
  const isCurrentUser = (id: string) => Boolean(currentUserId && id === currentUserId);
  const positionById = new Map(allResults.map((result, index) => [result.id, index + 1]));

  const rows = filteredResults.map((result, index) => {
    const mappedPosition = positionById.get(result.id);
    const position = myScoreOnly ? (mappedPosition ?? index + 1) : index + 1;

    return {
      result,
      position,
      isHighlighted: isCurrentUser(result.id),
    };
  });

  return (
    <>
      <div className="mt-5 space-y-3 md:hidden">
        {rows.map(({ result, position, isHighlighted }) => (
          <article
            key={result.id}
            className={`flex items-center justify-between gap-3 rounded-[10px] px-[15px] py-[15px] ${
              isHighlighted ? "bg-[#e9f7ee]" : "bg-[#010a04]/[0.04]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-[10px]">
              <span className="inline-flex h-[28px] min-w-[28px] items-center justify-center rounded-[4px] bg-[#010a04] px-1 text-[14px] font-medium text-white">
                {position}
              </span>
              <span
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
                  result
                )} text-[11px] font-semibold text-[#010a04]/80`}
              >
                {initialsFromName(result.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium leading-tight text-[#010a04]">
                  {result.name}
                  {result.hasLeft ? " (left)" : ""}
                </p>
                <p className="line-clamp-2 text-[12px] text-[#010a04]/55">
                  <span className="text-[#010a04]">{result.wins}</span> {t("tournaments.resultsWins")}
                  <span className="px-1.5 text-[#010a04]/25">•</span>
                  <span className="text-[#010a04]">{result.totalScoreAdvantage}</span>{" "}
                  {t("tournaments.resultsTotalScoreAdvantage")}
                </p>
              </div>
            </div>
            <PositionChangeIndicator
              change={result.positionChange}
              className="shrink-0 text-[12px] font-medium"
              iconClassName="size-[14px]"
              zeroLabel="00"
            />
          </article>
        ))}
      </div>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[660px] border-collapse">
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
            {rows.map(({ result, position, isHighlighted }) => (
              <tr
                key={result.id}
                className={`border-b border-[#e5e7eb] transition-colors ${
                  isHighlighted ? "bg-[#f0fdf4]" : "hover:bg-[#f9fafb]"
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[4px] bg-[#010a04] px-1 text-sm font-medium text-white">
                      {position}
                    </span>
                    <PositionChangeIndicator change={result.positionChange} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${participantToneClass(
                        result
                      )} text-[10px] font-semibold text-[#010a04]/80`}
                    >
                      {initialsFromName(result.name)}
                    </span>
                    <span className="truncate text-sm font-medium text-[#111827]">
                      {result.name}
                      {result.hasLeft ? " (left)" : ""}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#374151]">{result.wins}</td>
                <td className="px-4 py-3 text-sm text-[#374151]">{result.totalScoreAdvantage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
