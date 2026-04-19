import type { TFunction } from "i18next";

type TournamentSchedulePageSkeletonProps = {
  t: TFunction;
};

function PulseBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-skeleton-soft rounded-md bg-[rgba(1,10,4,0.08)] ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function TournamentSchedulePageSkeleton({ t }: TournamentSchedulePageSkeletonProps) {
  const courtPlaceholders = [0, 1, 2, 3, 4, 5];
  const tableRows = [0, 1, 2];

  return (
    <div
      className="mx-auto flex w-full max-w-[430px] flex-col gap-4 bg-[#f8fbf8] px-4 pb-10 pt-6 sm:max-w-6xl sm:bg-transparent sm:px-6 sm:pt-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{t("common.loading")}</span>

      <PulseBar className="h-5 w-[5.5rem]" />

      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:px-5">
        <div className="mb-5 border-b border-[#e5e7eb] pb-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <PulseBar className="h-11 w-11 shrink-0 rounded-2xl sm:h-12 sm:w-12" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <PulseBar className="h-7 max-w-[min(100%,14rem)] sm:h-8" />
              <PulseBar className="h-4 max-w-[min(100%,10rem)]" />
            </div>
          </div>
        </div>

        <PulseBar className="mb-[18px] h-6 w-44 sm:h-7 sm:w-52" />

        <div className="grid grid-cols-2 gap-[10px] md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <PulseBar className="h-3 w-28" />
              <PulseBar className="h-[38px] w-full rounded-[8px]" />
            </div>
          ))}
        </div>

        <div className="mt-[15px]">
          <div className="mb-[10px] flex items-center justify-between gap-3">
            <PulseBar className="h-3 w-36" />
            <PulseBar className="h-3 w-32" />
          </div>
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 lg:grid-cols-6">
            {courtPlaceholders.map((i) => (
              <PulseBar key={i} className="h-[38px] rounded-[8px]" />
            ))}
          </div>
        </div>

        <div className="mt-[25px]">
          <PulseBar className="h-[38px] w-full rounded-[8px]" />
        </div>
      </div>

      <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:px-5">
        <div className="mb-4 flex flex-col gap-4 sm:mb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <PulseBar className="h-7 w-56 sm:h-8 sm:w-64" />
          <PulseBar className="h-10 w-full max-w-[200px] rounded-full sm:shrink-0" />
        </div>

        <div className="overflow-hidden rounded-[10px] border border-[rgba(1,10,4,0.06)]">
          <div className="flex h-10 items-center gap-3 border-b border-[rgba(1,10,4,0.06)] bg-[rgba(1,10,4,0.03)] px-3 sm:px-4">
            <PulseBar className="h-3 w-6" />
            <PulseBar className="h-3 flex-1 max-w-[40%]" />
            <PulseBar className="hidden h-3 w-24 sm:block" />
            <PulseBar className="hidden h-3 w-20 md:block" />
          </div>
          {tableRows.map((row) => (
            <div
              key={row}
              className="flex h-12 items-center gap-3 border-b border-[rgba(1,10,4,0.05)] px-3 last:border-b-0 sm:px-4"
            >
              <PulseBar className="h-3 w-5" />
              <PulseBar className="h-3 flex-1 max-w-[45%]" />
              <PulseBar className="hidden h-3 w-20 sm:block" />
              <div className="ml-auto flex shrink-0 gap-2">
                <PulseBar className="h-8 w-8 rounded-md" />
                <PulseBar className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
