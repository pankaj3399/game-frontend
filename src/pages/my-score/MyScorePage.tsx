import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

import type {
  MyScoreDateRange,
  MyScoreFilterMode,
} from "@/models/myScore/types";

import { myScoreDateRangeSchema } from "@/models/myScore/types";
import { PAGE_SIZE } from "./constants";
import {
  MyScoreDesktopTable,
  MyScoreHeaderControls,
  MyScoreMobileCards,
  MyScorePagination,
  MyScoreSummaryStrip,
  MyScorePageSkeleton,
} from "./components";
import {
  buildPaginationItems,
  formatDateForMyScore,
  formatScoreValue,
  parseModeFromSearch,
  parsePageFromSearch,
  parseRangeFromSearch,
} from "./helpers";
import { useMyScore } from "./hooks";

export default function MyScorePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<MyScoreFilterMode>(() =>
    parseModeFromSearch(location.search),
  );

  const [range, setRange] = useState<MyScoreDateRange>(() =>
    parseRangeFromSearch(location.search),
  );

  const [page, setPage] = useState<number>(() =>
    parsePageFromSearch(location.search),
  );

  const myScoreQuery = useMyScore({
    mode,
    range,
    page,
    limit: PAGE_SIZE,
  }, {
    onSuccess: (data) => {
      const maxPage = data.pagination.totalPages;
      const clampedPage = maxPage === 0 ? 1 : Math.min(page, maxPage);
      if (clampedPage !== page) {
        setPage(clampedPage);
      }
    },
  });

  const serverTotalPages = myScoreQuery.data?.pagination?.totalPages;
  const effectivePage =
    serverTotalPages == null
      ? page
      : Math.min(page, serverTotalPages === 0 ? 1 : serverTotalPages);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set("mode", mode);
    params.set("range", range);
    params.set("page", String(page));

    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith("?")
      ? location.search.slice(1)
      : location.search;

    if (nextSearch !== currentSearch) {
      navigate(`${location.pathname}?${nextSearch}`, { replace: true });
    }
  }, [location.pathname, location.search, mode, navigate, page, range]);

  const onShare = async () => {
    try {
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const shareUrl = new URL(baseUrl);

      shareUrl.searchParams.set("mode", mode);
      shareUrl.searchParams.set("range", range);
      shareUrl.searchParams.set("page", String(effectivePage));

      await navigator.clipboard.writeText(shareUrl.toString());

      toast.success(t("myScorePage.shareSuccess"));
    } catch {
      toast.error(t("myScorePage.shareError"));
    }
  };

  const entriesCount = myScoreQuery.data?.entries.length ?? 0;
  const pagination = myScoreQuery.data?.pagination;
  const total = pagination?.total ?? entriesCount;
  const limit = pagination?.limit ?? PAGE_SIZE;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const showPaginationFooter = Boolean(pagination) || total > 0;

  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, Math.max(1, totalPages)),
    [currentPage, totalPages],
  );

  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;

  const to = total === 0 ? 0 : Math.min(currentPage * limit, total);

  const onPageChange = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > Math.max(1, totalPages) ||
      nextPage === currentPage
    ) {
      return;
    }

    setPage(nextPage);
  };

  if (myScoreQuery.isLoading) {
    return <MyScorePageSkeleton />;
  }

  if (myScoreQuery.isError || !myScoreQuery.data) {
    return (
      <div className="min-h-screen bg-[#dfe2e0] px-4 pb-10 pt-7 sm:px-6">
        <div className="mx-auto w-full max-w-[1120px] rounded-[10px] border border-[#f1b3b3] bg-[#fff7f7] p-4 text-sm text-[#a02626] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          {getErrorMessage(myScoreQuery.error) ?? t("myScorePage.loadError")}
        </div>
      </div>
    );
  }

  const { summary, entries } = myScoreQuery.data;

  return (
    <div className="min-h-screen bg-[#dfe2e0] px-4 pb-10 pt-7 ">
      <div className="mx-auto w-full max-w-[1120px] min-w-0 space-y-3">
        <MyScoreSummaryStrip summary={summary} />

        <MyScoreHeaderControls
          mode={mode}
          range={range}
          onChangeMode={(nextMode) => {
            setMode(nextMode);
            setPage(1);
          }}
          onChangeRange={(nextRange) => {
            const parsed = myScoreDateRangeSchema.safeParse(nextRange);

            if (parsed.success) {
              setRange(parsed.data);
              setPage(1);
            }
          }}
          onShare={onShare}
        >
          {entries.length > 0 ? (
            <>
              <MyScoreDesktopTable
                entries={entries}
                formatPlayedAt={formatDateForMyScore}
                formatScore={formatScoreValue}
              />
              <MyScoreMobileCards
                entries={entries}
                formatPlayedAt={formatDateForMyScore}
                formatScore={formatScoreValue}
              />
            </>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="text-[14px] text-[#010a04]/55">{t("myScorePage.empty")}</p>
            </div>
          )}

          {showPaginationFooter ? (
            <MyScorePagination
              from={from}
              to={to}
              total={total}
              currentPage={currentPage}
              totalPages={Math.max(1, totalPages)}
              items={paginationItems}
              onPageChange={onPageChange}
            />
          ) : null}
        </MyScoreHeaderControls>
      </div>
    </div>
  );
}