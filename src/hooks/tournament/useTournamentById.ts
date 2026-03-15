import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export interface ClubSponsorSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  link: string | null;
}

export interface TournamentDetail {
  id: string;
  name: string;
  logo: string | null;
  club: { id: string; name: string } | null;
  sponsor: { id: string; name: string; logoUrl: string | null; link: string | null } | null;
  clubSponsors: ClubSponsorSummary[];
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  playMode: string;
  tournamentMode: string;
  externalFee: number;
  minMember: number;
  maxMember: number;
  playTime: string | null;
  pauseTime: string | null;
  courts: { id: string; name: string; type: string | null; placement: string | null }[];
  foodInfo: string;
  descriptionInfo: string;
  numberOfRounds: number;
  roundTimings: { startDate: string | null; endDate: string | null }[];
  status: "active" | "draft" | "inactive";
  participants: { id: string; name: string | null; alias: string | null }[];
  progress: { spotsFilled: number; spotsTotal: number; percentage: number };
  permissions: { canEdit: boolean; canJoin: boolean; isParticipant: boolean };
  createdAt: string | null;
  updatedAt: string | null;
}

interface TournamentDetailResponse {
  tournament: TournamentDetail;
}

async function fetchTournamentById(id: string): Promise<TournamentDetailResponse> {
  const res = await api.get<TournamentDetailResponse>(`/api/tournaments/${id}`);
  return res.data;
}

export function useTournamentById(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tournament.detail(id),
    queryFn: () => fetchTournamentById(id!),
    enabled: !!id && enabled,
  });
}
