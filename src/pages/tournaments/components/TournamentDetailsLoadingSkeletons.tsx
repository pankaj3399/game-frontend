import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTournamentDetailsTabOptions } from "@/pages/tournaments/components/details-tabs/tabConfig";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-skeleton-soft rounded-md bg-[rgba(1,10,4,0.08)] ${className ?? ""}`}
      aria-hidden
    />
  );
}

/** Mirrors {@link InfoTab} layout (description, club, meta, food, players, sidebar). */
function InfoTabContentSkeleton() {
  const metaPlaceholders = [0, 1, 2, 3, 4, 5];
  const playerPlaceholders = [0, 1, 2, 3];

  return (
    <div className="grid gap-7 xl:grid-cols-[577px_368px] xl:items-start xl:justify-center xl:gap-12">
      <div className="order-2 min-w-0 xl:order-1">
        <section className="border-b border-[#dddddd] pb-[25px] sm:pb-[30px]">
          <div>
            <div className="mb-[17px] flex items-center justify-between gap-3">
              <Shimmer className="h-7 w-28 rounded-md sm:w-32" />
              <Shimmer className="h-6 w-6 shrink-0 rounded-[6px]" />
            </div>
            <div className="space-y-2">
              <Shimmer className="h-4 w-full max-w-[540px]" />
              <Shimmer className="h-4 w-full max-w-[500px]" />
              <Shimmer className="h-4 w-[88%] max-w-[480px]" />
            </div>
          </div>

          <div className="mt-[30px] border-t border-[#dddddd] pt-[25px]">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[#010a04]/[0.04] px-[15px] py-3">
              <div className="flex min-w-0 items-center gap-[15px]">
                <Shimmer className="h-10 w-10 shrink-0 rounded-[20px]" />
                <div className="min-w-0 space-y-2">
                  <Shimmer className="h-5 w-40 sm:w-48" />
                  <Shimmer className="h-[18px] w-16" />
                </div>
              </div>
              <Shimmer className="h-[34px] w-[140px] rounded-[8px] sm:w-[168px]" />
            </div>
          </div>

          <div className="mt-[25px] grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-8">
            {metaPlaceholders.map((i) => (
              <div key={i} className="flex items-start gap-4 sm:gap-6">
                <Shimmer className="mt-px h-6 w-6 shrink-0 rounded sm:h-6 sm:w-6" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Shimmer className="h-5 w-[85%]" />
                  <Shimmer className="h-[18px] w-24" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[#dddddd] py-[18px]">
          <Shimmer className="h-7 w-44 rounded-md" />
          <div className="mt-[18px] space-y-2">
            <Shimmer className="h-4 w-full max-w-xl" />
            <Shimmer className="h-4 w-full max-w-lg" />
            <Shimmer className="h-4 w-[80%] max-w-md" />
          </div>
        </section>

        <section className="py-4 sm:py-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Shimmer className="h-7 w-48 rounded-md" />
            <Shimmer className="h-6 w-6 shrink-0 rounded-[6px]" />
          </div>
          <div className="grid grid-cols-2 gap-[10px] sm:gap-[14px]">
            {playerPlaceholders.map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-[12px] border border-[#010a04]/[0.08] bg-white px-3 py-2.5 sm:gap-5 sm:px-[15px] sm:py-3"
              >
                <Shimmer className="h-9 w-9 shrink-0 rounded-[20px] sm:h-10 sm:w-10" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Shimmer className="h-4 w-[90%]" />
                  <Shimmer className="h-[18px] w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-7 xl:w-[368px] xl:max-w-full">
        <div className="rounded-[12px] border border-[#dddddd] bg-transparent px-5 py-[22px] shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
          <Shimmer className="h-6 w-[min(100%,11rem)] rounded-md" />
          <div className="mt-6 space-y-[18px]">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Shimmer className="h-[18px] w-36" />
                <Shimmer className="h-[18px] w-10" />
              </div>
              <Shimmer className="h-[15px] w-full rounded-[111px]" />
            </div>
            <div className="grid grid-cols-2 overflow-hidden rounded-[8px] border border-[#010a04]/15">
              <div className="space-y-2 px-3 py-[11px]">
                <Shimmer className="h-3 w-24" />
                <Shimmer className="h-[18px] w-8" />
              </div>
              <div className="space-y-2 border-l border-[#010a04]/15 px-[13px] py-[11px]">
                <Shimmer className="h-3 w-24" />
                <Shimmer className="h-[18px] w-8" />
              </div>
            </div>
          </div>
          <div className="my-6 h-px w-full bg-[#dddddd]" aria-hidden />
          <div className="space-y-3">
            <Shimmer className="h-[42px] w-full rounded-[12px]" />
            <Shimmer className="h-[42px] w-full rounded-[10px]" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function MatchesTabLoadingBody() {
  const cardPlaceholders = [0, 1, 2, 3, 4, 5];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Shimmer className="h-9 min-w-[8rem] flex-1 rounded-lg sm:max-w-[14rem]" />
        <Shimmer className="h-9 min-w-[8rem] flex-1 rounded-lg sm:max-w-[12rem]" />
        <Shimmer className="h-9 w-full rounded-lg sm:ml-auto sm:w-40" />
      </div>

      <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white p-4 sm:mt-5 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <Shimmer className="h-5 w-40 sm:h-[1.125rem] sm:w-48" />
          <Shimmer className="h-6 w-24 rounded-md" />
        </div>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-[#f3f4f6] pt-4">
          <Shimmer className="h-4 w-44" />
          <Shimmer className="h-4 w-10" />
        </div>
        <Shimmer className="mt-2 h-2 w-full rounded-full" />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-4 w-28" />
          ))}
        </div>
      </div>

      <div className="mt-1">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Shimmer className="h-7 w-36 sm:h-8 sm:w-40" />
          <Shimmer className="h-8 w-full max-w-[200px] rounded-full sm:shrink-0" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cardPlaceholders.map((i) => (
            <div
              key={i}
                className="rounded-[12px] border border-[#010a04]/[0.08] bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex shrink-0">
                  <Shimmer className="size-5 rounded-full" />
                  <Shimmer className="-ml-1 size-5 rounded-full" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Shimmer className="h-4 w-[85%]" />
                  <Shimmer className="h-3 w-2/3" />
                </div>
              </div>
              <Shimmer className="mt-3 h-3 w-1/2" />
              <div className="mt-3 flex gap-2">
                <Shimmer className="h-6 w-20 rounded" />
                <Shimmer className="h-6 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ResultsTabLoadingBody() {
  const rows = [0, 1, 2, 3, 4, 5];

  return (
    <div className="rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[15px] py-5 shadow-[0_3px_15px_rgba(0,0,0,0.06)] sm:rounded-xl sm:border-[#e5e7eb] sm:px-6 sm:py-6 sm:shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <Shimmer className="h-6 w-40 sm:h-7 sm:w-48" />
        <Shimmer className="h-8 w-full max-w-[200px] rounded-full sm:shrink-0" />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[rgba(1,10,4,0.06)]">
        <div className="flex h-11 items-center gap-3 border-b border-[rgba(1,10,4,0.06)] bg-[rgba(1,10,4,0.03)] px-3 sm:px-4">
          <Shimmer className="h-3 w-8" />
          <Shimmer className="h-3 flex-1 max-w-[30%]" />
          <Shimmer className="hidden h-3 w-16 sm:block" />
          <Shimmer className="hidden h-3 w-14 md:block" />
          <Shimmer className="hidden h-3 w-12 lg:block" />
        </div>
        {rows.map((i) => (
          <div
            key={i}
            className="flex h-12 items-center gap-3 border-b border-[rgba(1,10,4,0.05)] px-3 last:border-b-0 sm:h-14 sm:px-4"
          >
            <Shimmer className="size-8 shrink-0 rounded-full" />
            <Shimmer className="h-3 flex-1 max-w-[40%]" />
            <Shimmer className="hidden h-3 w-12 sm:block" />
            <Shimmer className="h-3 w-10 sm:w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SponsorsTabLoadingBody() {
  const cards = [0, 1, 2, 3];
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6">
      <Shimmer className="mb-5 h-7 w-48 rounded-md sm:mb-6 sm:h-8" />
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((i) => (
          <Shimmer key={i} className="h-28 rounded-xl sm:h-32" />
        ))}
      </div>
    </div>
  );
}

type TournamentDetailsPageSkeletonProps = {
  /** From `resolveTournamentDetailsTab` — must match URL `?tab=` while tournament data loads. */
  activeTab: string;
};

/**
 * Full tournament details shell while the tournament query loads.
 * Tab strip and panel mirror `?tab=` so reloading e.g. Matches does not flash Info.
 */
export function TournamentDetailsPageSkeleton({ activeTab }: TournamentDetailsPageSkeletonProps) {
  const { t } = useTranslation();
  const tabOptions = getTournamentDetailsTabOptions(t);

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center bg-[#f8fbf8]"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{t("common.loading")}</span>
      <div className="w-full max-w-6xl px-5 pb-10 pt-7 sm:px-6 sm:pt-8 lg:px-6">
        <div className="mb-6 flex flex-row flex-wrap items-center justify-between gap-3 sm:mb-7">
          <Shimmer className="h-5 w-[5.5rem]" />
          <div className="flex flex-wrap justify-end gap-2">
            <Shimmer className="h-9 w-24 rounded-lg sm:w-28" />
            <Shimmer className="h-9 w-20 rounded-lg sm:w-24" />
          </div>
        </div>

        <div className="flex flex-col gap-5 pb-3 sm:gap-6 sm:pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <Shimmer className="h-10 w-10 shrink-0 rounded-[10px]" />
            <Shimmer className="h-8 max-w-[min(100%,20rem)] flex-1 sm:h-9" />
          </div>
          <Shimmer className="h-[45px] w-[200px] shrink-0 rounded-[10px] self-start max-lg:hidden" />
        </div>

        <Tabs value={activeTab} className="w-full">
          <div className="pointer-events-none mt-0.5 w-full select-none border-b border-[#dddddd] pb-6 sm:mt-1 sm:pb-7">
            <TabsList
              className="grid h-auto w-full max-w-full rounded-[10px] bg-[rgba(1,10,4,0.05)] p-1 sm:inline-flex sm:w-fit"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, tabOptions.length)}, minmax(0, 1fr))`,
              }}
            >
              {tabOptions.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-[30px] rounded-[8px] px-2 text-[13px] font-medium text-[#010a04]/70 data-[state=active]:bg-white data-[state=active]:text-[#010a04] data-[state=active]:shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] sm:px-[15px] sm:text-[14px]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="info" className="mt-6 sm:mt-[30px]">
            <InfoTabContentSkeleton />
          </TabsContent>

          <TabsContent value="matches" className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
            <MatchesTabLoadingBody />
          </TabsContent>

          <TabsContent value="results" className="mt-5 sm:mt-6">
            <ResultsTabLoadingBody />
          </TabsContent>

          <TabsContent value="sponsors" className="mt-5 sm:mt-6">
            <SponsorsTabLoadingBody />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function MatchesTabSkeleton({ t }: { t: TFunction }) {
  return (
    <TabsContent value="matches" className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">{t("common.loading")}</span>
        <MatchesTabLoadingBody />
      </div>
    </TabsContent>
  );
}

export function ResultsTabSkeleton({ t }: { t: TFunction }) {
  return (
    <TabsContent value="results" className="mt-5 sm:mt-6">
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">{t("common.loading")}</span>
        <ResultsTabLoadingBody />
      </div>
    </TabsContent>
  );
}
