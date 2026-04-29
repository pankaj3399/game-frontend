import { useTranslation } from "react-i18next";

export function RoundLoadingSkeleton() {
    const { t } = useTranslation();
    return (
      <div className="grid gap-3 lg:grid-cols-2" aria-busy="true" aria-live="polite">
        <span className="sr-only">{t("tournaments.matchScheduleLoadingRound")}</span>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[14px] border border-[#010a04]/[0.06] bg-[#010a04]/[0.03] p-4">
            <div className="mb-3 flex gap-3">
              <div className="h-3.5 w-20 animate-pulse rounded bg-[#010a04]/[0.07]" />
              <div className="h-3.5 w-16 animate-pulse rounded bg-[#010a04]/[0.07]" />
              <div className="h-3.5 w-14 animate-pulse rounded bg-[#010a04]/[0.07]" />
            </div>
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-14 animate-pulse rounded-full bg-[#010a04]/[0.07]" />
              <div className="h-7 w-20 animate-pulse rounded-[7px] bg-[#010a04]/[0.07]" />
            </div>
            <div className="flex flex-col gap-0.5">
              {[0, 1].map((j) => (
                <div key={j} className="flex items-center justify-between rounded-[10px] bg-[#010a04]/[0.035] px-2.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 animate-pulse rounded-full bg-[#010a04]/[0.07]" />
                    <div className="h-4 w-24 animate-pulse rounded bg-[#010a04]/[0.07]" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-[30px] w-8 animate-pulse rounded-[6px] bg-[#010a04]/[0.07]" />
                    <div className="h-[30px] w-8 animate-pulse rounded-[6px] bg-[#010a04]/[0.07]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }