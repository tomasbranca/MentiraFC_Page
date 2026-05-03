import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getAllGames } from "../../../../data/games";
import { getGoalEvents } from "../../../../data/events";
import { getPlayerBySlug } from "../../../../data/players";
import { queryKeys } from "../../../../data/queryKeys";
import { getPlayerStats } from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/useInitialData";
import type { Game, GoalEvent, Player } from "../../../../types/models";

type PlayerDetailViewModel = Player & {
  goalsThisYear: number;
  matchesPlayedThisYear: number;
};

export const usePlayerDetail = (slug: string | undefined) => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const detailFromInitialData =
    initialData.currentPlayerDetail?.slug === slug
      ? initialData.currentPlayerDetail
      : null;
  const playerQueryKey = useMemo(
    () => queryKeys.players.bySlug(slug ?? ""),
    [slug]
  );
  const cacheSnapshot = useMemo(() => {
    const hasPlayer =
      queryClient.getQueryState(playerQueryKey)?.data !== undefined;
    const hasGames =
      queryClient.getQueryState(queryKeys.games.finished)?.data !== undefined;
    const hasGoalEvents =
      queryClient.getQueryState(queryKeys.events.goals(currentYear))?.data !==
      undefined;

    return {
      cachedPlayer: hasPlayer
        ? queryClient.getQueryData<Player | null>(playerQueryKey)
        : undefined,
      cachedGames: hasGames
        ? queryClient.getQueryData<Game[]>(queryKeys.games.finished)
        : undefined,
      cachedGoalEvents: hasGoalEvents
        ? queryClient.getQueryData<GoalEvent[]>(queryKeys.events.goals(currentYear))
        : undefined,
      hasGames,
      hasGoalEvents,
      hasPlayer,
    };
  }, [currentYear, playerQueryKey, queryClient]);
  const initialPlayer = cacheSnapshot.hasPlayer
    ? cacheSnapshot.cachedPlayer ?? null
    : detailFromInitialData?.player ?? undefined;
  const initialGames =
    cacheSnapshot.cachedGames ??
    (initialData.bootstrapScope === "full" ? initialData.games : undefined);
  const initialGoalEvents =
    cacheSnapshot.cachedGoalEvents ??
    (initialData.bootstrapScope === "full" ? initialData.goalEvents : undefined);
  const hasResolvedMissingPlayer =
    (cacheSnapshot.hasPlayer && cacheSnapshot.cachedPlayer === null) ||
    detailFromInitialData?.player === null;
  const shouldLoadPlayer =
    Boolean(slug) && !detailFromInitialData && !cacheSnapshot.hasPlayer;
  const shouldLoadGames =
    Boolean(slug) &&
    !detailFromInitialData &&
    !cacheSnapshot.hasGames &&
    !hasResolvedMissingPlayer;
  const shouldLoadGoalEvents =
    Boolean(slug) &&
    !detailFromInitialData &&
    !cacheSnapshot.hasGoalEvents &&
    !hasResolvedMissingPlayer;

  const playerQuery = useQuery({
    queryKey: playerQueryKey,
    queryFn: async () => {
      try {
        return await getPlayerBySlug(slug ?? "");
      } catch (error) {
        reportError(error, {
          page: "PlayerDetail",
          action: "refresh_player_detail",
          slug,
        });
        throw error;
      }
    },
    enabled: shouldLoadPlayer,
    initialData: shouldLoadPlayer ? undefined : initialPlayer,
    placeholderData: shouldLoadPlayer ? initialPlayer : undefined,
    refetchOnMount: shouldLoadPlayer ? "always" : false,
  });

  const gamesQuery = useQuery({
    queryKey: queryKeys.games.finished,
    queryFn: async () => {
      try {
        return await getAllGames();
      } catch (error) {
        reportError(error, {
          page: "PlayerDetail",
          action: "refresh_player_detail_games",
          slug,
        });
        throw error;
      }
    },
    enabled: shouldLoadGames,
    initialData: shouldLoadGames ? undefined : initialGames,
    placeholderData: shouldLoadGames ? initialGames : undefined,
    refetchOnMount: shouldLoadGames ? "always" : false,
  });

  const goalEventsQuery = useQuery({
    queryKey: queryKeys.events.goals(currentYear),
    queryFn: async () => {
      try {
        return await getGoalEvents({ year: currentYear });
      } catch (error) {
        reportError(error, {
          page: "PlayerDetail",
          action: "refresh_player_detail_goal_events",
          slug,
        });
        throw error;
      }
    },
    enabled: shouldLoadGoalEvents,
    initialData: shouldLoadGoalEvents
      ? undefined
      : initialGoalEvents,
    placeholderData: shouldLoadGoalEvents
      ? initialGoalEvents
      : undefined,
    refetchOnMount: shouldLoadGoalEvents ? "always" : false,
  });

  const player = useMemo<PlayerDetailViewModel | null>(() => {
    const playerSource = playerQuery.data ?? null;

    if (!playerSource) {
      return null;
    }

    const gamesSource = gamesQuery.data;
    const goalEventsSource = goalEventsQuery.data;

    if (gamesSource && goalEventsSource) {
      const stats = getPlayerStats(gamesSource, playerSource.id, {
        year: currentYear,
        goalEvents: goalEventsSource,
      });

      return {
        ...playerSource,
        goalsThisYear: stats.goals,
        matchesPlayedThisYear: stats.matchesPlayed,
      };
    }

    return {
      ...playerSource,
      goalsThisYear: detailFromInitialData?.goalsThisYear ?? 0,
      matchesPlayedThisYear: detailFromInitialData?.matchesPlayedThisYear ?? 0,
    };
  }, [
    currentYear,
    detailFromInitialData,
    gamesQuery.data,
    goalEventsQuery.data,
    playerQuery.data,
  ]);

  const hasGamesForStats = gamesQuery.data !== undefined;
  const loading =
    (shouldLoadPlayer && playerQuery.isFetching) ||
    (shouldLoadGames && gamesQuery.isFetching) ||
    (shouldLoadGoalEvents && goalEventsQuery.isFetching);
  const error = Boolean(
    playerQuery.error || gamesQuery.error || goalEventsQuery.error
  );

  return {
    player,
    loading,
    error,
    year: hasGamesForStats
      ? currentYear
      : detailFromInitialData?.year ?? currentYear,
    refetch: async () => {
      await Promise.all([
        playerQuery.refetch(),
        gamesQuery.refetch(),
        goalEventsQuery.refetch(),
      ]);
    },
  };
};
