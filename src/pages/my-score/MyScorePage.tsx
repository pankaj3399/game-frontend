import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
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
  });

  const maxPage = myScoreQuery.data?.pagination.totalPages ?? 1;
  const effectivePage = Math.min(page, maxPage);

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

  const pagination = myScoreQuery.data?.pagination;
  const currentPage = Math.min(page, pagination?.totalPages ?? 1);

  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, pagination?.totalPages ?? 1),
    [currentPage, pagination?.totalPages],
  );

  const from =
    pagination?.total === 0
      ? 0
      : (currentPage - 1) * (pagination?.limit ?? PAGE_SIZE) + 1;

  const to = Math.min(
    currentPage * (pagination?.limit ?? PAGE_SIZE),
    pagination?.total ?? 0,
  );

  const onPageChange = (nextPage: number) => {
    if (
      !pagination ||
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
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

          <MyScorePagination
            from={from}
            to={to}
            total={pagination?.total ?? 0}
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 1}
            items={paginationItems}
            onPageChange={onPageChange}
          />
        </MyScoreHeaderControls>
      </div>
    </div>
  );
}