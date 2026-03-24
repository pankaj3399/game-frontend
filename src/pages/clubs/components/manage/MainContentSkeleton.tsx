import { cn } from "@/lib/utils";

type MainContentSkeletonProps = {
  className?: string;
};

export function MainContentSkeleton({ className }: MainContentSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-black/8 bg-white px-[15px] py-6 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)] lg:px-3 lg:py-6",
        className
      )}
    >
      <div className="animate-pulse space-y-4">
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
