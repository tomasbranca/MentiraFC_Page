// @ts-nocheck
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getNews } from "../../../../data/news";
import { getTournament } from "../../../../data/tournament";
import { getAllGames, getTournamentGames } from "../../../../data/games";
import { getPlayers } from "../../../../data/players";
import { getTeams } from "../../../../data/teams";
import { queryKeys } from "../../../../data/queryKeys";
import { reportError } from "../../../../lib/errors/errorLogger";

import { sortNews } from "../../../utils/news.utils";
import {
  getHybridTournamentTable,
  getTopScorers,
} from "../../../../domain/stats";

export const useHomeData = () => {
  const year = new Date().getFullYear();

  const [
    newsQuery,
    playersQuery,
    gamesQuery,
    tournamentQuery,
    teamsQuery,
    tournamentGamesQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.news.all,
        queryFn: async () => {
          try {
            return await getNews();
          } catch (error) {
            reportError(error, { page: "Home", action: "load_home_news" });
            throw error;
          }
        },
      },
      {
        queryKey: queryKeys.players.all,
        queryFn: async () => {
          try {
            return await getPlayers();
          } catch (error) {
            reportError(error, { page: "Home", action: "load_home_players" });
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
            reportError(error, { page: "Home", action: "load_home_games" });
            throw error;
          }
        },
      },
      {
        queryKey: queryKeys.tournaments.current,
        queryFn: async () => {
          try {
            return await getTournament();
          } catch (error) {
            reportError(error, {
              page: "Home",
              action: "load_home_tournament",
            });
            throw error;
          }
        },
      },
      {
        queryKey: queryKeys.teams.all,
        queryFn: async () => {
          try {
            return await getTeams();
          } catch (error) {
            reportError(error, { page: "Home", action: "load_home_teams" });
            throw error;
          }
        },
      },
      {
        queryKey: queryKeys.games.tournamentFinished,
        queryFn: async () => {
          try {
            return await getTournamentGames();
          } catch (error) {
            reportError(error, {
              page: "Home",
              action: "load_home_tournament_games",
            });
            throw error;
          }
        },
      },
    ],
  });

  const data = useMemo(() => {
    const players = playersQuery.data ?? [];
    const finishedGames = gamesQuery.data ?? [];
    const tournament = tournamentQuery.data ?? null;
    const teams = teamsQuery.data ?? [];
    const finishedTournamentGames = tournamentGamesQuery.data ?? [];

    const topScorers = getTopScorers(finishedGames, players, { year });
    const mainTeam = teams.find((team) => team.isMain) || null;

    const gamesFromActiveTournament = finishedTournamentGames.filter(
      (game) => game.tournamentId === tournament?.id
    );

    const hybridTournament = tournament
      ? {
          ...tournament,
          standings: getHybridTournamentTable({
            manualStandings: tournament.standings,
            games: gamesFromActiveTournament,
            mainTeam,
          }),
        }
      : null;

    return {
      news: sortNews(newsQuery.data ?? []),
      topScorers,
      tournament: hybridTournament,
    };
  }, [
    gamesQuery.data,
    newsQuery.data,
    playersQuery.data,
    teamsQuery.data,
    tournamentGamesQuery.data,
    tournamentQuery.data,
    year,
  ]);

  return {
    ...data,
    loading:
      newsQuery.isLoading ||
      playersQuery.isLoading ||
      gamesQuery.isLoading ||
      tournamentQuery.isLoading ||
      teamsQuery.isLoading ||
      tournamentGamesQuery.isLoading,
    error:
      newsQuery.isError ||
      playersQuery.isError ||
      gamesQuery.isError ||
      tournamentQuery.isError ||
      teamsQuery.isError ||
      tournamentGamesQuery.isError,
    refetch: async () => {
      await Promise.all([
        newsQuery.refetch(),
        playersQuery.refetch(),
        gamesQuery.refetch(),
        tournamentQuery.refetch(),
        teamsQuery.refetch(),
        tournamentGamesQuery.refetch(),
      ]);
    },
  };
};
