function SummarySkeleton() {
  return (
    <section className="rounded-[10px] border border-[#010a04]/8 bg-white px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] sm:px-5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-24 animate-skeleton-soft rounded bg-[#010a04]/10" />
            <div className="h-5 w-16 animate-skeleton-soft rounded bg-[#067429]/20" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function MyScorePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#dfe2e0] px-4 pb-10 pt-7 sm:px-6">
      <div className="mx-auto w-full max-w-[1120px] min-w-0 space-y-3">
        <SummarySkeleton />

        <section className="overflow-hidden rounded-[10px] border border-[#010a04]/10 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <header className="flex flex-col gap-2.5 border-b border-[#010a04]/8 px-4 py-3 sm:px-5">
            <div className="h-6 w-28 animate-skeleton-soft rounded bg-[#010a04]/10" />

            <div className="flex flex-wrap items-center gap-1.5">
              <div className="h-8 w-[190px] animate-skeleton-soft rounded-[8px] bg-[#010a04]/8" />
              <div className="h-8 w-[112px] animate-skeleton-soft rounded-[8px] bg-[#010a04]/8" />
              <div className="h-8 w-[72px] animate-skeleton-soft rounded-[8px] bg-[#010a04]/12" />
            </div>
          </header>
        </section>
      </div>
    </div>
  );
}
