import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TournamentDetail } from "@/models/tournament/types";
import { TabsContent } from "@/components/ui/tabs";
import { getErrorMessage } from "@/lib/errors";
import { useTournamentMatches } from "@/pages/tournaments/hooks";
import { deriveResults } from "./results-tab/deriveResults";
import { getResultsContent } from "./results-tab/getResultsContent";
import { ResultsHeader } from "./results-tab/ResultsHeader";

interface ResultsTabProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
}

export function ResultsTab({ tournament, currentUserId }: ResultsTabProps) {
  const { t } = useTranslation();
  const [myScoreOnly, setMyScoreOnly] = useState(false);
  const matchesQuery = useTournamentMatches(tournament.id, true);

  if (matchesQuery.isLoading) {
    return (
      <TabsContent value="results" className="mt-5 sm:mt-6">
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-[#6b7280]">{t("common.loading")}</p>
        </div>
      </TabsContent>
    );
  }

  if (matchesQuery.isLoadingError) {
    return (
      <TabsContent value="results" className="mt-5 sm:mt-6">
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-[#a02626]">
            {getErrorMessage(matchesQuery.error) ?? t("tournaments.matchesLoadError")}
          </p>
        </div>
      </TabsContent>
    );
  }

  const scheduleMatches = matchesQuery.data?.matches ?? [];

  const results = deriveResults(tournament, scheduleMatches, t("tournaments.unknownPlayer"));

  const filteredResults = (!myScoreOnly || !currentUserId)
    ? results
    : results.filter((r) => r.id === currentUserId);
  const resultsContent = getResultsContent({
    results,
    filteredResults,
    myScoreOnly,
    currentUserId,
    t,
  });

  return (
    <TabsContent value="results" className="mt-5 sm:mt-6">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6">
        <ResultsHeader
          myScoreOnly={myScoreOnly}
          onMyScoreOnlyChange={setMyScoreOnly}
          disabled={!currentUserId}
          t={t}
        />
        {resultsContent}
      </div>
    </TabsContent>
  );
}
