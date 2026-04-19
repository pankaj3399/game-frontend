import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TournamentDetail } from "@/models/tournament/types";
import { TabsContent } from "@/components/ui/tabs";
import { getErrorMessage } from "@/lib/errors";
import { useTournamentMatches } from "@/pages/tournaments/hooks";
import { deriveResults } from "./results-tab/deriveResults";
import { getResultsContent } from "./results-tab/getResultsContent";
import { ResultsHeader } from "./results-tab/ResultsHeader";
import { ResultsTabSkeleton } from "@/pages/tournaments/components/TournamentDetailsLoadingSkeletons";

interface ResultsTabProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
}

export function ResultsTab({ tournament, currentUserId }: ResultsTabProps) {
  const { t } = useTranslation();
  const [myScoreOnly, setMyScoreOnly] = useState(false);
  const matchesQuery = useTournamentMatches(tournament.id, true);

  if (matchesQuery.isLoading) {
    return <ResultsTabSkeleton t={t} />;
  }

  if (matchesQuery.isLoadingError) {
    return (
      <TabsContent value="results" className="mt-5 sm:mt-6">
        <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:rounded-xl sm:border-[#e5e7eb] sm:px-6 sm:py-6 sm:shadow-sm">
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
      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:rounded-xl sm:border-[#e5e7eb] sm:px-6 sm:py-6 sm:shadow-sm">
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
