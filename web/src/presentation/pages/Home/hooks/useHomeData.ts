// @ts-nocheck
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getAllGames, getTournamentGames } from "../../../../data/games";
import { getNews } from "../../../../data/news";
import { getPlayers } from "../../../../data/players";
import { queryKeys } from "../../../../data/queryKeys";
import { getTeams } from "../../../../data/teams";
import { getTournament } from "../../../../data/tournament";
import {
  getHybridTournamentTable,
  getTopScorers,
} from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/InitialDataContext";
import { sortNews } from "../../../utils/news.utils";

export const useHomeData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const year = new Date().getFullYear();
  const shouldHydrateDeferredData = initialData.bootstrapScope === "home-critical";

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
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!deferredHomeQuery.data) {
      return;
    }

    queryClient.setQueryData(queryKeys.players.all, deferredHomeQuery.data.players);
    queryClient.setQueryData(queryKeys.games.finished, deferredHomeQuery.data.games);
    queryClient.setQueryData(
      queryKeys.tournaments.current,
      deferredHomeQuery.data.tournament
    );
    queryClient.setQueryData(queryKeys.teams.all, deferredHomeQuery.data.teams);
    queryClient.setQueryData(
      queryKeys.games.tournamentFinished,
      deferredHomeQuery.data.tournamentGames
    );
  }, [deferredHomeQuery.data, queryClient]);

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

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchNews);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetchNews, 250);
    return () => window.clearTimeout(timeoutId);
  }, [initialData.bootstrapScope, queryClient]);

  const homeData = useMemo(() => {
    const players = deferredHomeQuery.data?.players ?? initialData.players;
    const games = deferredHomeQuery.data?.games ?? initialData.games;
    const tournamentSource =
      deferredHomeQuery.data?.tournament ?? initialData.tournament;
    const teams = deferredHomeQuery.data?.teams ?? initialData.teams;
    const tournamentGames =
      deferredHomeQuery.data?.tournamentGames ?? initialData.tournamentGames;

    const topScorers = getTopScorers(games, players, {
      year,
    });

    const mainTeam = teams.find((team) => team.isMain) || null;

    const gamesFromActiveTournament = tournamentGames.filter(
      (nextGame) => nextGame.tournamentId === tournamentSource?.id
    );

    const tournament = tournamentSource
      ? {
          ...tournamentSource,
          standings: getHybridTournamentTable({
            manualStandings: tournamentSource.standings,
            games: gamesFromActiveTournament,
            mainTeam,
          }),
        }
      : null;

    return {
      news: sortNews(initialData.news),
      topScorers,
      tournament,
    };
  }, [deferredHomeQuery.data, initialData, year]);

  return {
    ...homeData,
    year,
  };
};
