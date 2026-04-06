import { useTranslation } from "react-i18next";
import type { TournamentDetail } from "@/models/tournament/types";
import { TabsContent } from "@/components/ui/tabs";
import { SponsorsList } from "./sponsors-tab/SponsorsList";

interface SponsorsTabProps {
  tournament: TournamentDetail;
}

export function SponsorsTab({ tournament }: SponsorsTabProps) {
  const { t } = useTranslation();
  const sponsors = tournament.clubSponsors ?? [];

  return (
    <TabsContent value="sponsors" className="mt-5 sm:mt-6">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
          {t("tournaments.clubSponsors")}
        </h2>
        <SponsorsList sponsors={sponsors} t={t} />
      </div>
    </TabsContent>
  );
}
