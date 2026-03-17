import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

export interface FavoriteClub {
  id: string;
  name: string;
}

interface FavoriteClubsResponse {
  favoriteClubs: FavoriteClub[];
  homeClub: FavoriteClub | null;
}

async function fetchFavoriteClubs(): Promise<FavoriteClubsResponse> {
  const res = await api.get<FavoriteClubsResponse>("/api/user/favorite-clubs");
  return res.data;
}

async function addFavoriteClub(clubId: string) {
  const res = await api.post<string>("/api/user/favorite-clubs", {
    club: clubId,
  });
  return res.data;
}

async function removeFavoriteClub(clubId: string) {
  const res = await api.delete<string>(
    `/api/user/favorite-clubs/${clubId}`
  );
  return res.data;
}

async function setHomeClub(clubId: string) {
  const res = await api.patch<string>("/api/user/home-club", {
    club: clubId,
  });
  return res.data;
}

export function useFavoriteClubs() {
  return useQuery({
    queryKey: queryKeys.user.favoriteClubs(),
    queryFn: fetchFavoriteClubs,
  });
}

export function useAddFavoriteClub() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addFavoriteClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.favoriteClubs() });
    },
  });
  return mutation;
}

export function useRemoveFavoriteClub() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: removeFavoriteClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.favoriteClubs() });
    },
  });
  return mutation;
}

export function useSetHomeClub() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: setHomeClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.favoriteClubs() });
    },
  });
  return mutation;
}
