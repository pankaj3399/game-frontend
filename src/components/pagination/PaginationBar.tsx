import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginationInfoContext = {
  from: number;
  to: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

interface PaginationBarProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;

  info?: (ctx: PaginationInfoContext) => ReactNode;
  prevLabel?: ReactNode;
  nextLabel?: ReactNode;

  hideIfSinglePage?: boolean;
  className?: string;
}

export function PaginationBar({
  pagination,
  onPageChange,
  info,
  prevLabel = "Previous",
  nextLabel = "Next",
  hideIfSinglePage = true,
  className,
}: PaginationBarProps) {
  if (hideIfSinglePage && pagination.totalPages <= 1) return null;

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  const canGoPrev = pagination.page > 1;
  const canGoNext = pagination.page < pagination.totalPages;

  const infoNode =
    info?.({
      from,
      to,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    }) ?? (
      <span>
        {from}-{to} of {pagination.total}
      </span>
    );

  return (
    <div
      className={[
        "flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-5 md:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-center text-sm text-muted-foreground sm:text-left">{infoNode}</p>
      <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex-1 sm:flex-none"
          disabled={!canGoPrev}
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        >
          {prevLabel}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 flex-1 sm:flex-none"
          disabled={!canGoNext}
          onClick={() =>
            onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
          }
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

