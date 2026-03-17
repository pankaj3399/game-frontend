import { useMemo } from "react";
import { useClubPublic } from "@/pages/clubs/hooks";

export function useClubDetailData(clubId: string | undefined) {
  const query = useClubPublic(clubId);

  const courts = useMemo(() => query.data?.courts ?? [], [query.data?.courts]);
  const sponsors = useMemo(() => query.data?.sponsors ?? [], [query.data?.sponsors]);

  return {
    ...query,
    club: query.data,
    courts,
    sponsors,
  };
}
