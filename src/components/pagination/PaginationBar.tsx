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
        "flex items-center justify-between border-t border-border px-6 py-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-sm text-muted-foreground">{infoNode}</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoPrev}
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        >
          {prevLabel}
        </Button>
        <Button
          variant="outline"
          size="sm"
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

