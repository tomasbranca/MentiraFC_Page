// @ts-nocheck
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getPlayerBySlug } from "../../../../data/players";
import { getAllGames } from "../../../../data/games";
import { queryKeys } from "../../../../data/queryKeys";
import { getPlayerStats } from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";

export const usePlayerDetail = (slug) => {
  const year = new Date().getFullYear();

  const [playerQuery, gamesQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.players.bySlug(slug),
        enabled: Boolean(slug),
        queryFn: async () => {
          try {
            return await getPlayerBySlug(slug);
          } catch (error) {
            reportError(error, {
              page: "PlayerDetail",
              action: "load_player_detail",
              slug,
            });
            throw error;
          }
        },
      },
      {
        queryKey: queryKeys.games.finished,
        queryFn: async () => {
          try {
            return await getAllGames();
          } catch (error) {
            reportError(error, {
              page: "PlayerDetail",
              action: "load_player_games",
              slug,
            });
            throw error;
          }
        },
      },
    ],
  });

  const player = useMemo(() => {
    if (!playerQuery.data) {
      return null;
    }

    const stats = getPlayerStats(gamesQuery.data ?? [], playerQuery.data.id, {
      year,
    });

    return {
      ...playerQuery.data,
      goalsThisYear: stats.goals,
    };
  }, [gamesQuery.data, playerQuery.data, year]);

  return {
    player,
    loading: playerQuery.isLoading || gamesQuery.isLoading,
    error: playerQuery.isError || gamesQuery.isError,
    year,
    refetch: async () => {
      await Promise.all([playerQuery.refetch(), gamesQuery.refetch()]);
    },
  };
};
