import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TournamentDetail } from "@/models/tournament/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTab } from "./InfoTab";
import { MatchesTab } from "./MatchesTab";
import { ResultsTab } from "./ResultsTab";
import { SponsorsTab } from "./SponsorsTab";

interface TournamentDetailsTabsProps {
  tournament: TournamentDetail;
  currentUserId: string | null;
  onJoin: () => Promise<void>;
  isJoinPending: boolean;
}

export function TournamentDetailsTabs({
  tournament,
  currentUserId,
  onJoin,
  isJoinPending,
}: TournamentDetailsTabsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("info");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mt-6 h-auto w-fit rounded-lg bg-[#f2f3f5] p-1">
        {[
          { value: "info", label: t("tournaments.info") },
          { value: "matches", label: t("tournaments.matches") },
          { value: "results", label: t("tournaments.results") },
          { value: "sponsors", label: t("tournaments.sponsorsTab") },
        ].map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-9 rounded-md px-5 text-sm font-medium text-[#6b7280] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <InfoTab
        tournament={tournament}
        isJoinPending={isJoinPending}
        onJoin={onJoin}
      />
      <MatchesTab tournament={tournament} currentUserId={currentUserId} />
      <ResultsTab tournament={tournament} currentUserId={currentUserId} />
      <SponsorsTab tournament={tournament} />
    </Tabs>
  );
}
