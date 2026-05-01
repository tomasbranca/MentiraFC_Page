import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getPlayers } from "../../../../data/players";
import { queryKeys } from "../../../../data/queryKeys";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadTeamInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/useInitialData";
import { groupPlayersByPosition } from "../team.utils";
import type { Player } from "../../../../types/models";

const EMPTY_PLAYERS: Player[] = [];

export const useTeamData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const hasCachedPlayers = useRef(
    queryClient.getQueryState(queryKeys.players.all)?.data !== undefined
  );
  const cachedPlayers = hasCachedPlayers.current
    ? queryClient.getQueryData<Player[]>(queryKeys.players.all)
    : undefined;
  const initialPlayers = cachedPlayers ?? initialData.players;
  const needsInitialFetch =
    !hasCachedPlayers.current &&
    shouldLoadTeamInitially(initialData.bootstrapScope, initialPlayers.length);

  const playersQuery = useQuery({
    queryKey: queryKeys.players.all,
    queryFn: async () => {
      try {
        return await getPlayers();
      } catch (error) {
        reportError(error, {
          page: "Team",
          action: "refresh_team_players",
        });
        throw error;
      }
    },
    enabled: needsInitialFetch,
    initialData: needsInitialFetch ? undefined : initialPlayers,
    placeholderData: needsInitialFetch ? initialPlayers : undefined,
    refetchOnMount: needsInitialFetch ? "always" : false,
  });

  const players = playersQuery.data ?? EMPTY_PLAYERS;
  const grouped = useMemo(() => groupPlayersByPosition(players), [players]);
  const loading = needsInitialFetch && playersQuery.isFetching;
  const error = Boolean(playersQuery.error);

  return {
    players,
    grouped,
    loading,
    error,
    refetch: async () => {
      await playersQuery.refetch();
    },
  };
};
