import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { shareDataWithUrlInText } from "@/lib/webShare";
import { useAuth } from "@/pages/auth/hooks";

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
  MyScoreResultsRegion,
  MyScoreSummaryStrip,
  MyScorePageSkeleton,
} from "./components";
import {
  buildPaginationItems,
  buildPlayerScoreShareUrl,
  formatDateForMyScore,
  formatScoreValue,
  parseModeFromSearch,
  parsePageFromSearch,
  parseRangeFromSearch,
} from "./helpers";
import { useMyScore } from "./hooks";

export default function MyScorePage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { playerId: routePlayerId } = useParams<{ playerId?: string }>();
  const { user } = useAuth();

  const isSharedView = Boolean(routePlayerId);

  const [mode, setMode] = useState<MyScoreFilterMode>(() =>
    parseModeFromSearch(location.search),
  );

  const [range, setRange] = useState<MyScoreDateRange>(() =>
    parseRangeFromSearch(location.search),
  );

  const [page, setPage] = useState<number>(() =>
    parsePageFromSearch(location.search),
  );

  const myScoreQuery = useMyScore(
    {
      playerId: routePlayerId,
      mode,
      range,
      page,
      limit: PAGE_SIZE,
    },
    {
      enabled: isSharedView ? Boolean(routePlayerId) : Boolean(user?.id),
    },
  );

  useEffect(() => {
    if (!myScoreQuery.isSuccess || !myScoreQuery.data) return;
    const maxPage = myScoreQuery.data.pagination.totalPages;
    const clampedPage = maxPage === 0 ? 1 : Math.min(page, maxPage);
    if (clampedPage !== page) {
      setPage(clampedPage);
    }
  }, [myScoreQuery.isSuccess, myScoreQuery.data?.pagination.totalPages, page]);

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

  const pageTitle = useMemo(() => {
    if (!isSharedView) {
      return t("myScorePage.title");
    }

    const displayName = myScoreQuery.data?.player?.displayName?.trim();
    if (displayName) {
      return t("myScorePage.playerScoreTitle", { name: displayName });
    }

    return t("myScorePage.sharedTitle");
  }, [isSharedView, myScoreQuery.data?.player?.displayName, t]);

  const onShare = async () => {
    const sharePlayerId =
      routePlayerId ?? user?.id ?? myScoreQuery.data?.player?.id;

    if (!sharePlayerId) {
      toast.error(t("myScorePage.shareError"));
      return;
    }

    const urlString = buildPlayerScoreShareUrl(sharePlayerId, {
      mode,
      range,
      page: effectivePage,
    });

    const shareLabel =
      myScoreQuery.data?.player?.displayName?.trim() || t("myScorePage.title");

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(
          shareDataWithUrlInText({
            textBeforeUrl: shareLabel,
            url: urlString,
          }),
        );
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(urlString);
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

  const awaitingSubject =
    (isSharedView && !routePlayerId) || (!isSharedView && !user?.id);
  const isInitialLoad = myScoreQuery.isLoading && !myScoreQuery.data;
  const isRefreshing = myScoreQuery.isFetching && Boolean(myScoreQuery.data);

  if (awaitingSubject || isInitialLoad) {
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
    <div className="min-h-screen bg-[#dfe2e0] px-4 pb-10 pt-7">
      <div className="mx-auto w-full max-w-[1120px] min-w-0 space-y-3">
        <MyScoreSummaryStrip summary={summary} isRefreshing={isRefreshing} />

        <MyScoreHeaderControls
          title={pageTitle}
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
          <MyScoreResultsRegion isRefreshing={isRefreshing}>
            {entries.length > 0 ? (
              <>
                <MyScoreDesktopTable
                  entries={entries}
                  formatPlayedAt={(playedAt) =>
                    formatDateForMyScore(playedAt, i18n.language)
                  }
                  formatScore={formatScoreValue}
                />
                <MyScoreMobileCards
                  entries={entries}
                  formatPlayedAt={(playedAt) =>
                    formatDateForMyScore(playedAt, i18n.language)
                  }
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
          </MyScoreResultsRegion>
        </MyScoreHeaderControls>
      </div>
    </div>
  );
}
