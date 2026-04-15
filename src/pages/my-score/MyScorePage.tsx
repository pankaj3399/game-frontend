import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/errors";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import type {
  MyScoreDateRange,
  MyScoreEntry,
  MyScoreFilterMode,
} from "@/models/myScore/types";
import { myScoreDateRangeSchema } from "@/models/myScore/types";
import { useMyScore } from "./hooks";

const FILTER_MODES: MyScoreFilterMode[] = ["all", "singles", "doubles"];

const DATE_RANGES: MyScoreDateRange[] = ["last30Days", "allTime"];

function formatPlayedAt(playedAt: string, language: string): string {
  try {
    const parsed = parseISO(playedAt);
    if (!Number.isFinite(parsed.getTime())) {
      return "-";
    }

    return format(parsed, "dd MMM, yyyy", {
      locale: getDateFnsLocale(language),
    });
  } catch {
    return "-";
  }
}

function formatScore(value: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return "-";
  }

  return String(value);
}

function tournamentBadgeLabel(entry: MyScoreEntry): string {
  const name = entry.tournament.name.trim();
  if (!name) {
    return "?";
  }

  const tokens = name.split(/\s+/).filter(Boolean);
  const first = tokens[0]?.[0] ?? "?";
  const second = tokens[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export default function MyScorePage() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<MyScoreFilterMode>("all");
  const [range, setRange] = useState<MyScoreDateRange>("last30Days");

  const myScoreQuery = useMyScore({ mode, range });

  const onShare = async () => {
    try {
      const baseUrl = `${window.location.origin}/my-score`;
      const shareUrl = new URL(baseUrl);
      shareUrl.searchParams.set("mode", mode);
      shareUrl.searchParams.set("range", range);

      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(shareUrl.toString());
      toast.success(t("myScorePage.shareSuccess"));
    } catch {
      toast.error(t("myScorePage.shareError"));
    }
  };

  if (myScoreQuery.isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#f8fbf8] px-5 pb-10 pt-[30px] sm:px-6 sm:pt-[45px]">
        <div className="mx-auto max-w-[992px] rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white p-6 text-sm text-[#6a6a6a] shadow-[0_3px_15px_rgba(0,0,0,0.06)]">
          {t("myScorePage.loading")}
        </div>
      </div>
    );
  }

  if (myScoreQuery.isError || !myScoreQuery.data) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#f8fbf8] px-5 pb-10 pt-[30px] sm:px-6 sm:pt-[45px]">
        <div className="mx-auto max-w-[992px] rounded-[12px] border border-[#f1b3b3] bg-[#fff7f7] p-6 text-sm text-[#a02626] shadow-[0_3px_15px_rgba(0,0,0,0.06)]">
          {getErrorMessage(myScoreQuery.error) ?? t("myScorePage.loadError")}
        </div>
      </div>
    );
  }

  const { summary, entries } = myScoreQuery.data;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f8fbf8] px-5 pb-10 pt-[30px] sm:px-6 sm:pt-[45px] lg:min-h-[calc(100vh-60px)]">
      <div className="mx-auto max-w-[992px]">
        <section className="mb-[14px] rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white px-[18px] py-[14px] shadow-[0_3px_15px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 gap-2 text-[18px] sm:grid-cols-3">
            <p className="font-medium text-[#010a04]">
              {t("myScorePage.totalMatches")}: <span className="font-bold text-[#0a6925]">{summary.totalMatches}</span>
            </p>
            <p className="font-medium text-[#010a04]">
              {t("myScorePage.totalWins")}: <span className="font-bold text-[#0a6925]">{summary.totalWins}</span>
            </p>
            <p className="font-medium text-[#010a04]">
              {t("myScorePage.glicko2")}: <span className="font-bold text-[#0a6925]">{summary.glicko2.rating}{"\u00B1"}{summary.glicko2.rd}</span>
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white shadow-[0_3px_15px_rgba(0,0,0,0.06)]">
          <header className="flex flex-col gap-3 px-[16px] pb-[10px] pt-[18px] sm:flex-row sm:items-center sm:justify-between sm:px-[18px]">
            <h1 className="text-[30px] font-semibold leading-none tracking-[-0.01em] text-[#010a04]">
              {t("myScorePage.title")}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-[30px] items-center rounded-[6px] bg-[#010a04]/[0.05] p-[3px]">
                {FILTER_MODES.map((value) => {
                  const selected = mode === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setMode(value)}
                      className={`h-full rounded-[5px] px-3 text-[12px] font-medium transition-colors ${
                        selected
                          ? "bg-white text-[#010a04] shadow-[0_0_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]"
                          : "text-[#010a04]/70"
                      }`}
                    >
                      {t(`myScorePage.filters.${value}`)}
                    </button>
                  );
                })}
              </div>

              <Select
                value={range}
                onValueChange={(next) => {
                  const parsedRange = myScoreDateRangeSchema.safeParse(next);
                  if (parsedRange.success) {
                    setRange(parsedRange.data);
                  }
                }}
              >
                <SelectTrigger className="h-[30px] rounded-[6px] border-[rgba(1,10,4,0.12)] px-[10px] text-[12px]">
                  <SelectValue placeholder={t("myScorePage.filters.last30Days")} />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`myScorePage.filters.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={onShare}
                className="inline-flex h-[30px] items-center justify-center rounded-[8px] bg-[#010a04] px-[15px] text-[12px] font-medium text-white transition-colors hover:bg-[#172017]"
              >
                {t("myScorePage.share")}
              </button>
            </div>
          </header>

          <div className="overflow-x-auto">
            {entries.length > 0 ? (
              <div className="min-w-[760px]">
                <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#010a04]/[0.04] px-[16px] py-2 sm:px-[18px]">
                  <div className="grid grid-cols-[128px_1.6fr_1.6fr_1fr_1fr] gap-4 text-[12px] font-normal text-[#010a04]/80">
                    <p>{t("myScorePage.table.date")}</p>
                    <p>{t("myScorePage.table.tournament")}</p>
                    <p>{t("myScorePage.table.opponent")}</p>
                    <p>{t("myScorePage.table.myScore")}</p>
                    <p>{t("myScorePage.table.opponentScore")}</p>
                  </div>
                </div>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[128px_1.6fr_1.6fr_1fr_1fr] items-center gap-4 border-b border-[rgba(0,0,0,0.06)] px-[16px] py-[11px] text-[14px] text-[#010a04] last:border-b-0 sm:px-[18px]"
                  >
                    <p>{formatPlayedAt(entry.playedAt, i18n.language)}</p>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[#d9d9d9] text-[10px] font-semibold text-[#010a04]/75">
                        {tournamentBadgeLabel(entry)}
                      </span>
                      <p className="truncate">{entry.tournament.name}</p>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-[17px] w-[17px] shrink-0 rounded-full bg-[#d9d9d9]" aria-hidden="true" />
                      <p className="truncate">{entry.opponent.name}</p>
                    </div>
                    <p>{formatScore(entry.myScore)}</p>
                    <p>{formatScore(entry.opponentScore)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center text-[14px] text-[#010a04]/70">
                {t("myScorePage.empty")}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
