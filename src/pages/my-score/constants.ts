import type { MyScoreDateRange, MyScoreFilterMode } from "@/models/myScore/types";

export const FILTER_MODES: MyScoreFilterMode[] = ["all", "singles", "doubles"];
export const DATE_RANGES: MyScoreDateRange[] = ["last30Days", "allTime"];
export const PAGE_SIZE = 10;
