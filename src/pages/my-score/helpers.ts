import { format, parseISO } from "date-fns";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import {
  myScoreDateRangeSchema,
  myScoreFilterModeSchema,
  type MyScoreDateRange,
  type MyScoreFilterMode,
} from "@/models/myScore/types";

export function parseModeFromSearch(search: string): MyScoreFilterMode {
  const rawMode = new URLSearchParams(search).get("mode");
  const parsed = myScoreFilterModeSchema.safeParse(rawMode);
  return parsed.success ? parsed.data : "all";
}

export function parseRangeFromSearch(search: string): MyScoreDateRange {
  const rawRange = new URLSearchParams(search).get("range");
  const parsed = myScoreDateRangeSchema.safeParse(rawRange);
  return parsed.success ? parsed.data : "last30Days";
}

export function parsePageFromSearch(search: string): number {
  const rawPage = Number(new URLSearchParams(search).get("page"));
  if (!Number.isInteger(rawPage) || rawPage < 1) return 1;
  return rawPage;
}

/** Canonical public path for a player's score view (share targets). */
export function buildPlayerScoreSharePath(playerId: string): string {
  return `/players/${encodeURIComponent(playerId)}/score`;
}

export function buildPlayerScoreShareUrl(
  playerId: string,
  params: { mode: string; range: string; page: number },
): string {
  const shareUrl = new URL(
    buildPlayerScoreSharePath(playerId),
    window.location.origin,
  );
  shareUrl.searchParams.set("mode", params.mode);
  shareUrl.searchParams.set("range", params.range);
  shareUrl.searchParams.set("page", String(params.page));
  return shareUrl.toString();
}

export function formatDateForMyScore(playedAt: string, language: string): string {
  try {
    const parsed = parseISO(playedAt);
    if (!Number.isFinite(parsed.getTime())) return "-";
    return format(parsed, "dd MMM, yyyy", { locale: getDateFnsLocale(language) });
  } catch {
    return "-";
  }
}

export function formatScheduledMatchStartTime(
  startTime: string | null,
  language: string
): string {
  if (!startTime) {
    return "-";
  }
  try {
    const parsed = parseISO(startTime);
    if (!Number.isFinite(parsed.getTime())) {
      return "-";
    }
    return format(parsed, "dd MMM, yyyy · HH:mm", {
      locale: getDateFnsLocale(language),
    });
  } catch {
    return "-";
  }
}

export function formatScoreValue(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  return String(value);
}

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage,
  ]);

  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    pages.add(page);
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | "ellipsis"> = [];
  for (let index = 0; index < sortedPages.length; index += 1) {
    const current = sortedPages[index];
    const previous = sortedPages[index - 1];
    if (previous != null && current - previous > 1) {
      items.push("ellipsis");
    }
    items.push(current);
  }

  return items;
}
