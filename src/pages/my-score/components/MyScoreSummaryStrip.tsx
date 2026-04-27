import { useTranslation } from "react-i18next";
import type { MyScoreResponse } from "@/models/myScore/types";

interface MyScoreSummaryStripProps {
  summary: MyScoreResponse["summary"];
}

export function MyScoreSummaryStrip({ summary }: MyScoreSummaryStripProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-[10px] border border-[#010a04]/8 bg-white px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] sm:px-5">
      <div className="flex flex-col gap-1 sm:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-[#010a04]/90">
            {t("myScorePage.totalMatches")}:
          </p>
          <p className="text-[16px] font-semibold leading-none text-[#067429]">
            {summary.totalMatches}
          </p>
        </div>

        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-[#010a04]/90">
            {t("myScorePage.totalWins")}:
          </p>
          <p className="text-[16px] font-semibold leading-none text-[#067429]">
            {summary.totalWins}
          </p>
        </div>

        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-[#010a04]/90">
            {t("myScorePage.glicko2")}:
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-[16px] font-semibold leading-none text-[#067429]">
              {summary.glicko2.rating}
            </p>
            <p className="text-[13px] font-medium text-[#067429]">±{summary.glicko2.rd}</p>
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-3 gap-5 text-[#010a04] sm:grid">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="text-[13px] font-medium text-[#010a04]/90">
            {t("myScorePage.totalMatches")}:
          </p>
          <p className="truncate text-[22px] font-semibold leading-none text-[#067429]">
            {summary.totalMatches}
          </p>
        </div>

        <div className="flex min-w-0 items-baseline gap-2">
          <p className="text-[13px] font-medium text-[#010a04]/90">
            {t("myScorePage.totalWins")}:
          </p>
          <p className="truncate text-[22px] font-semibold leading-none text-[#067429]">
            {summary.totalWins}
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
          <p className="text-[13px] font-medium text-[#010a04]/90">
            {t("myScorePage.glicko2")}:
          </p>
          <p className="text-[22px] font-semibold leading-none text-[#067429]">
            {summary.glicko2.rating}
          </p>
          <p className="text-[13px] font-medium text-[#067429]">±{summary.glicko2.rd}</p>
        </div>
      </div>
    </section>
  );
}
