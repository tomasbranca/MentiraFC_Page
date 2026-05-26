import { useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getAllGames } from "../../../../data/games";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadRecordInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/useInitialData";
import type { Game } from "../../../../types/models";

export const useRecordData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const hasCachedGames = useRef(
    queryClient.getQueryState(queryKeys.games.finished)?.data !== undefined
  );
  const cachedGames = hasCachedGames.current
    ? queryClient.getQueryData<Game[]>(queryKeys.games.finished)
    : undefined;
  const initialGames = cachedGames ?? initialData.games;
  const needsInitialFetch =
    !hasCachedGames.current &&
    shouldLoadRecordInitially(initialData.bootstrapScope, initialGames.length);

  const gamesQuery = useQuery({
    queryKey: queryKeys.games.finished,
    queryFn: async () => {
      try {
        return await getAllGames();
      } catch (error) {
        reportError(error, {
          page: "Record",
          action: "refresh_record",
        });
        throw error;
      }
    },
    enabled: true,
    initialData: needsInitialFetch ? undefined : initialGames,
    placeholderData: needsInitialFetch ? initialGames : undefined,
    refetchInterval: SANITY_FRESHNESS.liveStats.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.liveStats.staleTime,
  });

  return {
    games: gamesQuery.data ?? [],
    loading: needsInitialFetch && gamesQuery.isFetching,
    error: Boolean(gamesQuery.error && typeof gamesQuery.data === "undefined"),
    refetch: async () => {
      await gamesQuery.refetch();
    },
  };
};
