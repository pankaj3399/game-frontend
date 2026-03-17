import { useTranslation } from "react-i18next";
import { PaginationBar } from "@/components/pagination/PaginationBar";
import type { ClubsPagination as ClubsPaginationState } from "@/pages/clubs/hooks";

interface ClubsPaginationProps {
  pagination: ClubsPaginationState;
  onPageChange: (page: number) => void;
}

export function ClubsPagination({ pagination, onPageChange }: ClubsPaginationProps) {
  const { t } = useTranslation();

  return (
    <PaginationBar
      pagination={{
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.totalCount,
        totalPages: pagination.totalPages,
      }}
      onPageChange={onPageChange}
      prevLabel={t("tournaments.prev")}
      nextLabel={t("tournaments.next")}
      info={({ from, to, total }) =>
        t("common.pagination.showingRange", {
          from,
          to,
          total,
        })
      }
      className="mt-8"
    />
  );
}
