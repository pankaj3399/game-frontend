import type { TournamentSponsor } from "@/models/tournament/types";
import type { TFunction } from "i18next";
import { SponsorCard } from "./SponsorCard";

interface SponsorsListProps {
  sponsors: TournamentSponsor[];
  t: TFunction;
}

export function SponsorsList({ sponsors, t }: SponsorsListProps) {
  if (sponsors.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{t("tournaments.noClubSponsors")}</p>;
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sponsors.map((sponsor) => (
        <SponsorCard key={sponsor.id} sponsor={sponsor} t={t} />
      ))}
    </div>
  );
}
