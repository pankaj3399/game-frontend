import { useTranslation } from "react-i18next";
import type { ClubListItem } from "@/pages/clubs/hooks";
import { ClubCard } from "./ClubCard";

interface ClubsGridProps {
  clubs: ClubListItem[];
}

export function ClubsGrid({ clubs }: ClubsGridProps) {
  const { t } = useTranslation();

  if (clubs.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        {t("clubs.noClubsYet")}
      </p>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  );
}
