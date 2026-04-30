import { cn } from "@/lib/utils";

type MainContentSkeletonProps = {
  className?: string;
};

export function MainContentSkeleton({ className }: MainContentSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-[12px] border border-black/8 bg-white px-[15px] py-6 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] lg:px-3 lg:py-6",
        className
      )}
    >
      <div className="animate-skeleton-soft space-y-4 lg:hidden">
        <div className="space-y-2">
          <div className="h-6 max-w-[72%] rounded-md bg-[#edf2ed]" />
          <div className="h-3 max-w-[56%] rounded-md bg-[#edf2ed]" />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="h-8 w-[7.5rem] max-w-full rounded-md bg-[#edf2ed]" />
          <div className="h-8 w-[8.75rem] max-w-full rounded-md bg-[#edf2ed]" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-[10px] bg-[#edf2ed]/60 p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[#edf2ed]" />
                <div className="min-w-0 flex-1 space-y-2 pt-1">
                  <div className="h-4 w-[72%] rounded bg-[#edf2ed]" />
                  <div className="h-3 w-[56%] rounded bg-[#edf2ed]" />
                </div>
              </div>

              <div className="my-4 h-px w-full bg-white/70" />

              <div className="flex items-center justify-between gap-3">
                <div className="h-3.5 w-[58%] max-w-[11rem] rounded bg-[#edf2ed]" />
                <div className="h-3.5 w-12 shrink-0 rounded bg-[#edf2ed]" />
              </div>
            </div>
          ))}
        </div>

        <div className="h-14 rounded-[10px] bg-[#edf2ed]" />
      </div>

      <div className="animate-skeleton-soft hidden space-y-4 lg:block">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-52 rounded-md bg-[#edf2ed]" />
            <div className="h-3 w-44 rounded-md bg-[#edf2ed]" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 rounded-md bg-[#edf2ed]" />
            <div className="h-8 w-36 rounded-md bg-[#edf2ed]" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-16 rounded-[10px] bg-[#edf2ed]" />
          <div className="h-16 rounded-[10px] bg-[#edf2ed]" />
          <div className="h-16 rounded-[10px] bg-[#edf2ed]" />
        </div>

        <div className="h-14 rounded-[10px] bg-[#edf2ed]" />
      </div>
    </div>
  );
}
