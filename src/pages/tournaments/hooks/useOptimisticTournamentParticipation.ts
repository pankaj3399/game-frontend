import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import type { TournamentDetailResponse } from "@/models/tournament/types";

interface UseOptimisticTournamentParticipationOptions {
  tournamentId: string;
  onParticipationAction: () => Promise<void>;
}

interface ParticipationMutationVariables {
  nextIsParticipant: boolean;
}

interface ParticipationMutationContext {
  previous?: TournamentDetailResponse;
}

export function useOptimisticTournamentParticipation({
  tournamentId,
  onParticipationAction,
}: UseOptimisticTournamentParticipationOptions) {
  const queryClient = useQueryClient();
  const tournamentQueryKey = queryKeys.tournament.detail(tournamentId);

  return useMutation<void, unknown, ParticipationMutationVariables, ParticipationMutationContext>({
    mutationFn: async () => onParticipationAction(),
    onMutate: async ({ nextIsParticipant }) => {
      await queryClient.cancelQueries({ queryKey: tournamentQueryKey });

      const previous = queryClient.getQueryData<TournamentDetailResponse>(tournamentQueryKey);

      queryClient.setQueryData<TournamentDetailResponse>(tournamentQueryKey, (oldData) => {
        if (!oldData) {
          return oldData;
        }

        const currentPermissions = oldData.tournament.permissions;
        return {
          ...oldData,
          tournament: {
            ...oldData.tournament,
            permissions: {
              ...currentPermissions,
              isParticipant: nextIsParticipant,
              canJoin: !nextIsParticipant,
              canLeave: nextIsParticipant,
            },
          },
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tournamentQueryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: tournamentQueryKey });
    },
  });
}