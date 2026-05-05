import { useTranslation } from "react-i18next";
import { TabsContent } from "@/components/ui/tabs";
import type { TournamentDetail } from "@/models/tournament/types";
import { useTournamentMatches } from "@/pages/tournaments/hooks";
import { MatchesTabSkeleton } from "@/pages/tournaments/components/TournamentDetailsLoadingSkeletons";
import { getErrorMessage } from "@/lib/errors";
import { OrganiserMatchesBoard } from "./matches-tab/OrganiserMatchesBoard";
import { PlayerMatchesBoard } from "./matches-tab/PlayerMatchesBoard";

interface MatchesTabProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
}

export function MatchesTab({ tournament, currentUserId }: MatchesTabProps) {
  const { t, i18n } = useTranslation();

  const matchesQuery = useTournamentMatches(tournament.id, true);
  const scheduleMatches = matchesQuery.data?.matches ?? [];

  if (matchesQuery.isLoading) {
    return <MatchesTabSkeleton t={t} />;
  }

  if (matchesQuery.isLoadingError) {
    return (
      <TabsContent value="matches" className="mt-5 sm:mt-6">
        <div className="rounded-xl border border-[#f1b3b3] bg-[#fff7f7] p-5 text-sm text-[#a02626]">
          {getErrorMessage(matchesQuery.error) ?? t("tournaments.matchesLoadError")}
        </div>
      </TabsContent>
    );
  }

  if (!tournament.permissions.canEdit) {
    return (
      <TabsContent value="matches" className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
        <PlayerMatchesBoard
          matches={scheduleMatches}
          currentUserId={currentUserId}
          language={i18n.language}
          timeZone={tournament.timezone}
          t={t}
        />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="matches" className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
      <OrganiserMatchesBoard tournament={tournament} />
    </TabsContent>
  );
}
