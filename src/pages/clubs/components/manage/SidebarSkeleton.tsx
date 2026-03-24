import { cn } from "@/lib/utils";
import { ManageClubInfoCard } from "@/pages/clubs/components/manage/ManageClubInfoCard";

type SidebarSkeletonProps = {
  className?: string;
};

export function SidebarSkeleton({ className }: SidebarSkeletonProps) {
  return (
    <aside className={cn("w-full lg:w-[312px]", className)}>
      <div className="rounded-[12px] border border-black/8 bg-white px-[15px] py-6 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]">
        <div className="animate-pulse space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-6 w-32 rounded-md bg-[#edf2ed]" />
              <div className="h-3 w-36 rounded-md bg-[#edf2ed]" />
            </div>
            <div className="h-8 w-28 rounded-md bg-[#edf2ed]" />
          </div>

          <div className="space-y-2 rounded-[8px] border border-black/8 p-2">
            <div className="flex items-center gap-3 rounded-[8px] px-2 py-2">
              <div className="h-10 w-10 rounded-full bg-[#edf2ed]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 rounded-md bg-[#edf2ed]" />
                <div className="h-3 w-24 rounded-md bg-[#edf2ed]" />
                <div className="h-3 w-20 rounded-md bg-[#edf2ed]" />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[8px] px-2 py-2">
              <div className="h-10 w-10 rounded-full bg-[#edf2ed]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-36 rounded-md bg-[#edf2ed]" />
                <div className="h-3 w-28 rounded-md bg-[#edf2ed]" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 hidden lg:block">
        <ManageClubInfoCard />
      </div>
    </aside>
  );
}
