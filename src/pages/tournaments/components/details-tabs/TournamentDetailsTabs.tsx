import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TournamentDetail } from "@/models/tournament/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoTab } from "./InfoTab";
import { MatchesTab } from "./MatchesTab";
import { ResultsTab } from "./ResultsTab";
import { SponsorsTab } from "./SponsorsTab";
import { getTournamentDetailsTabOptions } from "./tabConfig";

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
  const tabOptions = getTournamentDetailsTabOptions(t);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="mt-2 w-full border-b border-[#dddddd] pb-6 sm:mt-3 sm:pb-7">
        <TabsList
          className="grid h-auto w-full rounded-[10px] bg-[rgba(1,10,4,0.05)] p-1 sm:inline-flex sm:w-fit"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, tabOptions.length)}, minmax(0, 1fr))`,
          }}
        >
          {tabOptions.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-[30px] rounded-[8px] px-2 text-[13px] font-medium text-[#010a04]/70 data-[state=active]:bg-white data-[state=active]:text-[#010a04] data-[state=active]:shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] sm:px-[15px] sm:text-[14px]"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <InfoTab
        key={tournament.id}
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
