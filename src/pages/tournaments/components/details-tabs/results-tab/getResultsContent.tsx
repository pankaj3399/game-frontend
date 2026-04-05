import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import { ResultsTable } from "./ResultsTable";
import type { ParticipantResult } from "./types";

interface GetResultsContentArgs {
  results: ParticipantResult[];
  filteredResults: ParticipantResult[];
  myScoreOnly: boolean;
  currentUserId: string | null;
  t: TFunction;
}

export function getResultsContent({
  results,
  filteredResults,
  myScoreOnly,
  currentUserId,
  t,
}: GetResultsContentArgs): ReactNode {
  if (results.length === 0) {
    return <p className="mt-6 text-sm text-[#6b7280]">{t("tournaments.noResultsYet")}</p>;
  }

  if (filteredResults.length === 0) {
    return <p className="mt-6 text-sm text-[#6b7280]">{t("tournaments.noMyResults")}</p>;
  }

  return (
    <ResultsTable
      allResults={results}
      filteredResults={filteredResults}
      myScoreOnly={myScoreOnly}
      currentUserId={currentUserId}
      t={t}
    />
  );
}
