import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getAllGames, getTournamentGames } from "../../../../data/games";
import { getNews } from "../../../../data/news";
import { getPlayers } from "../../../../data/players";
import { queryKeys } from "../../../../data/queryKeys";
import { getTeams } from "../../../../data/teams";
import { getTournament } from "../../../../data/tournament";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/useInitialData";
import {
  getDeferredHomeQueryBehavior,
  hasCompleteDeferredHomeData,
  resolveHomeData,
} from "./useHomeData.utils";

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

export const useHomeData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const year = new Date().getFullYear();
  const shouldHydrateDeferredData = initialData.bootstrapScope === "home-critical";
  const cachedDeferredHomeData = queryClient.getQueryData(
    queryKeys.home.deferred
  );
  const deferredHomeQueryBehavior =
    getDeferredHomeQueryBehavior(cachedDeferredHomeData);

  const deferredHomeQuery = useQuery({
    queryKey: queryKeys.home.deferred,
    enabled: shouldHydrateDeferredData,
    queryFn: async () => {
      try {
        const [players, games, tournament, teams, tournamentGames] =
          await Promise.all([
            getPlayers(),
            getAllGames(),
            getTournament(),
            getTeams(),
            getTournamentGames(),
          ]);

        return {
          players,
          games,
          tournament,
          teams,
          tournamentGames,
        };
      } catch (error) {
        reportError(error, {
          page: "Home",
          action: "load_deferred_home_data",
        });

        throw error;
      }
    },
    staleTime: deferredHomeQueryBehavior.staleTime,
    refetchOnMount: deferredHomeQueryBehavior.refetchOnMount,
  });

  const deferredHomeData =
    shouldHydrateDeferredData && hasCompleteDeferredHomeData(deferredHomeQuery.data)
      ? deferredHomeQuery.data
      : null;

  useEffect(() => {
    if (!deferredHomeData) {
      return;
    }

    queryClient.setQueryData(queryKeys.players.all, deferredHomeData.players);
    queryClient.setQueryData(queryKeys.games.finished, deferredHomeData.games);
    queryClient.setQueryData(
      queryKeys.tournaments.current,
      deferredHomeData.tournament
    );
    queryClient.setQueryData(queryKeys.teams.all, deferredHomeData.teams);
    queryClient.setQueryData(
      queryKeys.games.tournamentFinished,
      deferredHomeData.tournamentGames
    );
  }, [deferredHomeData, queryClient]);

  useEffect(() => {
    if (initialData.bootstrapScope !== "home-critical") {
      return;
    }

    const prefetchNews = () => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.news.all,
        queryFn: getNews,
        staleTime: 1000 * 60,
      });
    };

    const idleWindow = window as IdleWindow;

    if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(prefetchNews);
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(prefetchNews, 250);
    return () => window.clearTimeout(timeoutId);
  }, [initialData.bootstrapScope, queryClient]);

  const homeData = useMemo(() => {
    return resolveHomeData(initialData, deferredHomeData, year);
  }, [deferredHomeData, initialData, year]);

  return {
    ...homeData,
    year,
  };
};
