import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TabsContent } from "@/components/ui/tabs";
import type { TournamentDetail } from "@/models/tournament/types";
import { MatchesActions } from "./matches-tab/MatchesActions";
import { MatchesList } from "./matches-tab/MatchesList";
import { MatchesProgress } from "./matches-tab/MatchesProgress";
import { useMatchesData } from "./matches-tab/useMatchesData";

interface MatchesTabProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
}

export function MatchesTab({ tournament, currentUserId }: MatchesTabProps) {
  const { t, i18n } = useTranslation();
  const [onlyMyMatches, setOnlyMyMatches] = useState(false);
  const { matches, filteredMatches, counts, currentRound } = useMatchesData({
    tournament,
    currentUserId,
    onlyMyMatches,
    language: i18n.language,
    t,
  });

  return (
    <TabsContent value="matches" className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
      <MatchesActions t={t} />
      <MatchesProgress counts={counts} total={matches.length} currentRound={currentRound} t={t} />
      <MatchesList
        matches={matches}
        filteredMatches={filteredMatches}
        onlyMyMatches={onlyMyMatches}
        onOnlyMyMatchesChange={setOnlyMyMatches}
        t={t}
      />
    </TabsContent>
  );
}
