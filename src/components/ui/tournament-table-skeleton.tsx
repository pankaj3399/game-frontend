export function TournamentTableSkeleton() {
  const rows = Array.from({ length: 5 }, (_, index) => index);

  return (
    <div aria-hidden="true" role="presentation">
      <div className="px-4 pb-4 sm:px-5 lg:hidden">
        <div className="flex flex-col gap-[15px]">
          {rows.map((row) => (
            <div key={row} className="rounded-[10px] bg-[rgba(1,10,4,0.04)] p-[14px]">
              <div className="flex items-center gap-[15px]">
                <div className="h-[45px] w-[45px] shrink-0 animate-pulse rounded-[7px] bg-black/10" />
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="h-4 w-[72%] animate-pulse rounded bg-black/10" />
                  <div className="h-3.5 w-[42%] animate-pulse rounded bg-black/10" />
                </div>
              </div>

              <div className="my-[14px] h-px w-full bg-black/10" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-black/10" />
                  <div className="h-3.5 w-28 animate-pulse rounded bg-black/10" />
                </div>
                <div className="h-3.5 w-14 animate-pulse rounded bg-black/10" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden border-y border-black/10 lg:block">
        <div className="h-[35px] bg-black/5" />
        <div className="px-4 py-2 md:px-5">
          {rows.map((row) => (
            <div
              key={row}
              className="flex h-[45px] items-center gap-3 border-b border-black/5 last:border-b-0"
            >
              <div className="h-3 w-5 animate-pulse rounded bg-black/10" />
              <div className="h-3 w-[38%] animate-pulse rounded bg-black/10" />
              <div className="h-3 w-[30%] animate-pulse rounded bg-black/10" />
              <div className="h-3 w-[16%] animate-pulse rounded bg-black/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
