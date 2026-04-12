// @ts-nocheck
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getTournament } from "../../../../data/tournament";
import { getTeams } from "../../../../data/teams";
import { getTournamentGames } from "../../../../data/games";
import { queryKeys } from "../../../../data/queryKeys";
import { getHybridTournamentTable } from "../../../../domain/stats";
import { reportError } from "../../../../lib/errors/errorLogger";

export const useTableData = () => {
  const [tournamentQuery, teamsQuery, gamesQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.tournaments.current,
        queryFn: async () => {
          try {
            return await getTournament();
          } catch (error) {
            reportError(error, {
              page: "Table",
              action: "load_table_tournament",
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
            reportError(error, {
              page: "Table",
              action: "load_table_teams",
            });
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
              page: "Table",
              action: "load_table_games",
            });
            throw error;
          }
        },
      },
    ],
  });

  const tournament = useMemo(() => {
    if (!tournamentQuery.data) {
      return null;
    }

    const mainTeam = (teamsQuery.data ?? []).find((team) => team.isMain) || null;

    const gamesFromActiveTournament = (gamesQuery.data ?? []).filter(
      (game) => game.tournamentId === tournamentQuery.data.id
    );

    const standings = getHybridTournamentTable({
      manualStandings: tournamentQuery.data.standings,
      games: gamesFromActiveTournament,
      mainTeam,
    });

    return {
      ...tournamentQuery.data,
      standings,
    };
  }, [gamesQuery.data, teamsQuery.data, tournamentQuery.data]);

  return {
    tournament,
    loading: tournamentQuery.isLoading || teamsQuery.isLoading || gamesQuery.isLoading,
    error: tournamentQuery.isError || teamsQuery.isError || gamesQuery.isError,
    refetch: async () => {
      await Promise.all([
        tournamentQuery.refetch(),
        teamsQuery.refetch(),
        gamesQuery.refetch(),
      ]);
    },
  };
};
