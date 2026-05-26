import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getTournamentGames } from "../../../../data/games";
import { getGoalEvents } from "../../../../data/events";
import { getHomeCriticalData } from "../../../../data/getInitialData";
import { getNews } from "../../../../data/news";
import { getPlayers } from "../../../../data/players";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { getTournament } from "../../../../data/tournament";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/useInitialData";
import {
  getDeferredHomeQueryBehavior,
  hasCompleteDeferredHomeData,
  isDeferredHomeDataPending,
  resolveHomeData,
} from "./useHomeData.utils";

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

const DEFERRED_HOME_DATA_DELAY_MS = 4500;

export const useHomeData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const year = new Date().getFullYear();
  const [shouldStartDeferredHomeData, setShouldStartDeferredHomeData] =
    useState(() =>
      initialData.bootstrapScope === "home-critical" &&
      hasCompleteDeferredHomeData(
        queryClient.getQueryData(queryKeys.home.deferred)
      )
    );
  const cachedDeferredHomeData = queryClient.getQueryData(
    queryKeys.home.deferred
  );
  const hasCachedDeferredHomeData = hasCompleteDeferredHomeData(
    cachedDeferredHomeData
  );
  const initialDeferredHomeData =
    initialData.bootstrapScope === "full" &&
    hasCompleteDeferredHomeData(initialData)
      ? initialData
      : undefined;
  const deferredHomeSeed = cachedDeferredHomeData ?? initialDeferredHomeData;
  const deferredHomeQueryBehavior =
    getDeferredHomeQueryBehavior(deferredHomeSeed);
  const shouldHydrateDeferredData =
    initialData.bootstrapScope === "full" ||
    (initialData.bootstrapScope === "home-critical" &&
      (shouldStartDeferredHomeData || hasCachedDeferredHomeData));
  const hasInitialHomeCriticalData =
    initialData.news.length > 0 || initialData.latestGame !== null;

  const homeCriticalQuery = useQuery({
    queryKey: queryKeys.home.critical,
    queryFn: async () => {
      try {
        return await getHomeCriticalData();
      } catch (error) {
        reportError(error, {
          page: "Home",
          action: "refresh_home_critical_data",
        });
        throw error;
      }
    },
    enabled:
      initialData.bootstrapScope !== "empty" &&
      initialData.bootstrapScope !== "bootstrap-error",
    initialData: hasInitialHomeCriticalData ? initialData : undefined,
    placeholderData: hasInitialHomeCriticalData ? initialData : undefined,
    refetchInterval: SANITY_FRESHNESS.news.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.news.staleTime,
  });

  useEffect(() => {
    if (initialData.bootstrapScope !== "home-critical") {
      setShouldStartDeferredHomeData(false);
      return;
    }

    if (hasCachedDeferredHomeData) {
      setShouldStartDeferredHomeData(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldStartDeferredHomeData(true);
    }, DEFERRED_HOME_DATA_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasCachedDeferredHomeData, initialData.bootstrapScope]);

  const deferredHomeQuery = useQuery({
    queryKey: queryKeys.home.deferred,
    enabled: shouldHydrateDeferredData,
    queryFn: async () => {
      try {
        const [players, goalEvents, tournament, tournamentGames] =
          await Promise.all([
            getPlayers(),
            getGoalEvents({ year }),
            getTournament(),
            getTournamentGames(),
          ]);

        return {
          players,
          goalEvents,
          tournament,
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
    refetchInterval: SANITY_FRESHNESS.liveStats.refetchInterval,
    initialData: initialDeferredHomeData,
    placeholderData: initialDeferredHomeData,
  });

  const deferredHomePayload =
    deferredHomeQuery.data ?? cachedDeferredHomeData ?? initialDeferredHomeData;
  const deferredHomeData = hasCompleteDeferredHomeData(deferredHomePayload)
    ? deferredHomePayload
    : null;

  useEffect(() => {
    if (!deferredHomeData) {
      return;
    }

    queryClient.setQueryData(queryKeys.players.all, deferredHomeData.players);
    queryClient.setQueryData(queryKeys.events.goals(year), deferredHomeData.goalEvents);
    queryClient.setQueryData(
      queryKeys.tournaments.current,
      deferredHomeData.tournament
    );
    queryClient.setQueryData(
      queryKeys.games.tournamentFinished,
      deferredHomeData.tournamentGames
    );
  }, [deferredHomeData, queryClient, year]);

  useEffect(() => {
    if (!homeCriticalQuery.data) {
      return;
    }

    queryClient.setQueryData(
      queryKeys.games.latest,
      homeCriticalQuery.data.latestGame
    );
  }, [homeCriticalQuery.data, queryClient]);

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
    const homeCriticalData = homeCriticalQuery.data;
    const baseData = homeCriticalData
      ? {
          ...initialData,
          news: homeCriticalData.news,
          latestGame: homeCriticalData.latestGame,
        }
      : initialData;

    return resolveHomeData(baseData, deferredHomeData, year);
  }, [deferredHomeData, homeCriticalQuery.data, initialData, year]);

  const isDeferredHomeLoading = isDeferredHomeDataPending(
    initialData.bootstrapScope,
    Boolean(deferredHomeData),
    deferredHomeQuery.isError
  );

  return {
    ...homeData,
    year,
    isDeferredHomeLoading,
  };
};
