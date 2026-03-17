import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TournamentListTab } from "@/models/tournament";

interface TournamentTabsProps {
  visible: boolean;
  activeTab: TournamentListTab;
  onTabChange: (tab: TournamentListTab) => void;
}

export function TournamentTabs({ visible, activeTab, onTabChange }: TournamentTabsProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (value !== "published" && value !== "drafts") return;
        onTabChange(value);
      }}
    >
      <TabsList variant="line" className="h-9">
        <TabsTrigger value="published">{t("tournaments.tabPublished")}</TabsTrigger>
        <TabsTrigger value="drafts">{t("tournaments.tabDrafts")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
