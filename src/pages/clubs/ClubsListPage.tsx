import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAllClubs } from "@/hooks/club";
import { useHasRoleOrAbove } from "@/hooks/auth";
import { ROLES } from "@/constants/roles";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import InlineLoader from "@/components/shared/InlineLoader";

const DESCRIPTION_MAX_LENGTH = 80;

function truncateDescription(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}...`;
}

export default function ClubsListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isFetching } = useAllClubs({ page, limit });
  const canManage = useHasRoleOrAbove(ROLES.CLUB_ADMIN);

  const clubs = data?.clubs ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const totalCount = data?.pagination?.totalCount ?? 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-gray-50">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold text-foreground">
              {t("clubs.allClubs")}
            </h1>
            {canManage && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/clubs/manage">
                  <HugeiconsIcon icon={Settings01Icon} size={16} className="mr-2" />
                  {t("clubs.manageClubs")}
                </Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <InlineLoader />
            </div>
          ) : clubs.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {t("clubs.noClubsYet")}
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clubs.map((club) => (
                  <div
                    key={club.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-t-xl bg-[#f3f4f6]">
                      <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-[#e5e7eb]">
                        <span className="text-2xl font-semibold text-[#9ca3af]">
                          {club.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold text-foreground">{club.name}</h3>
                      {club.address ? (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {truncateDescription(club.address, DESCRIPTION_MAX_LENGTH)}
                        </p>
                      ) : null}
                      <Link
                        to={`/clubs/${club.id}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0a9f43] hover:underline"
                      >
                        {t("clubs.viewDetails")}
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row">
                  <div>
                    {t("common.pagination.showingRange", {
                      from: (page - 1) * limit + (clubs.length > 0 ? 1 : 0),
                      to: (page - 1) * limit + clubs.length,
                      total: totalCount,
                    })}
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          disabled={page === 1 || isFetching}
                          onClick={() => {
                            if (page > 1 && !isFetching) {
                              setPage(page - 1);
                            }
                          }}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink isActive>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          disabled={page >= totalPages || isFetching}
                          onClick={() => {
                            if (page < totalPages && !isFetching) {
                              setPage(page + 1);
                            }
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
