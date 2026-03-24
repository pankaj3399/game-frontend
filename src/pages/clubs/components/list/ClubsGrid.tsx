import { useTranslation } from "react-i18next";
import type { ClubListItem } from "@/pages/clubs/hooks";
import { ClubCard } from "./ClubCard";
import { Button } from "@/components/ui/button";

interface ClubsGridProps {
  clubs: ClubListItem[];
  query: string;
  isSearching: boolean;
  onClearSearch: () => void;
}

export function ClubsGrid({
  clubs,
  query,
  isSearching,
  onClearSearch,
}: ClubsGridProps) {
  const { t } = useTranslation();
  const trimmedQuery = query.trim();

  if (clubs.length === 0) {
    if (isSearching) {
      return (
        <p className="mt-6 text-sm text-muted-foreground">{t("clubs.searching")}</p>
      );
    }

    if (trimmedQuery.length > 0) {
      return (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("clubs.noClubsForQuery", { query: trimmedQuery })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("clubs.tryAnotherSearch")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onClearSearch}
          >
            {t("clubs.clearSearch")}
          </Button>
        </div>
      );
    }

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
