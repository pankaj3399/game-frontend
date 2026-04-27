import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { MyScoreEntry } from "@/models/myScore/types";

interface MyScoreMobileCardsProps {
  entries: MyScoreEntry[];
  formatPlayedAt: (playedAt: string, language: string) => string;
  formatScore: (score: number | null) => string;
}

export function MyScoreMobileCards({
  entries,
  formatPlayedAt,
  formatScore,
}: MyScoreMobileCardsProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-2.5 p-2.5 sm:hidden">
      {entries.map((entry) => (
        <Card
          key={`mobile-card-${entry.id}`}
          className="overflow-hidden rounded-[10px] border border-[#010a04]/8 bg-[#f7f8f7]"
        >
          <CardContent className="space-y-2.5 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-8 w-8 shrink-0 rounded-[6px] bg-[#cfd3d0]" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#010a04]">
                  {entry.tournament.name}
                </p>
                <p className="text-[11px] text-[#010a04]/55">
                  {formatPlayedAt(entry.playedAt, i18n.language)}
                </p>
              </div>
            </div>

            <Separator className="bg-[#010a04]/8" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[22px] font-semibold leading-none text-[#010a04]">
                  {formatScore(entry.myScore)}
                </p>
                <p className="mt-1 text-[10px] text-[#010a04]/50">
                  {t("myScorePage.table.myScore")}
                </p>
              </div>

              <div>
                <p className="text-[22px] font-semibold leading-none text-[#010a04]">
                  {formatScore(entry.opponentScore)}
                </p>
                <p className="mt-1 text-[10px] text-[#010a04]/50">
                  {t("myScorePage.table.opponentScore")}
                </p>
              </div>
            </div>

            <Separator className="bg-[#010a04]/8" />

            <div>
              <p className="mb-1 text-[10px] text-[#010a04]/50">
                {t("myScorePage.table.opponent")}
              </p>
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#cfd3d0]" />
                <p className="truncate text-[12px] text-[#010a04]/85">{entry.opponent.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
