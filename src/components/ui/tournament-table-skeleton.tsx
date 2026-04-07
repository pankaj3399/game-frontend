export function TournamentTableSkeleton() {
  const rows = Array.from({ length: 8 }, (_, index) => index);

  return (
    <div
      className="border-y border-black/10"
      aria-hidden="true"
      role="presentation"
    >
      <div className="h-[35px] bg-black/5" />
      <div className="px-4 py-2">
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
  );
}
