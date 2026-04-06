import type { TFunction } from "i18next";
import { SwitchToggle } from "@/components/ui/switch-toggle";
import type { DerivedMatch } from "./types";
import { MatchCard } from "./MatchCard";

interface MatchesListProps {
  matches: DerivedMatch[];
  filteredMatches: DerivedMatch[];
  onlyMyMatches: boolean;
  onOnlyMyMatchesChange: (value: boolean) => void;
  t: TFunction;
}

export function MatchesList({
  matches,
  filteredMatches,
  onlyMyMatches,
  onOnlyMyMatchesChange,
  t,
}: MatchesListProps) {
  const emptyText = matches.length === 0 ? t("tournaments.noMatchesAvailable") : t("tournaments.noMyMatchesAvailable");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold leading-tight text-[#111827]">{t("tournaments.allMatches")}</h3>
        <SwitchToggle checked={onlyMyMatches} onCheckedChange={onOnlyMyMatchesChange}>
          {t("tournaments.myMatches")}
        </SwitchToggle>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d1d5db] bg-white p-8 text-sm text-[#6b7280]">{emptyText}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
