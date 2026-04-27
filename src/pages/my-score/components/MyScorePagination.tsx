import { useTranslation } from "react-i18next";
import { CardFooter } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface MyScorePaginationProps {
  from: number;
  to: number;
  total: number;
  currentPage: number;
  totalPages: number;
  items: Array<number | "ellipsis">;
  onPageChange: (page: number) => void;
}

export function MyScorePagination({
  from,
  to,
  total,
  currentPage,
  totalPages,
  items,
  onPageChange,
}: MyScorePaginationProps) {
  const { t } = useTranslation();

  return (
    <CardFooter className="border-t border-[#010a04]/8 px-4 py-3 sm:px-5">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-[#010a04]/52">
          {t("myScorePage.paginationInfo", { from, to, total })}
        </p>

        <Pagination className="mx-0 w-full justify-start sm:w-auto sm:justify-end">
          <PaginationContent className="flex-nowrap overflow-x-auto">
            <PaginationItem>
              <PaginationPrevious
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              />
            </PaginationItem>

            {items.map((item, index) => {
              if (item === "ellipsis") {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={`page-${item}`}>
                  <PaginationLink
                    isActive={item === currentPage}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </CardFooter>
  );
}
