import { useCallback } from "react";
import { getTournament } from "../../../data/tournament";
import { getTeams } from "../../../data/sanity/services/teams.service";
import { getTournamentGames } from "../../../data/games";
import { getHybridTournamentTable } from "../../../domain/stats";
import { useFetchData } from "../../../hooks/useFetchData";

export const useTableData = () => {
  const fetcher = useCallback(async () => {
    const [tournamentData, teams, games] = await Promise.all([
      getTournament(),
      getTeams(),
      getTournamentGames(),
    ]);

    if (!tournamentData) {
      return null;
    }

    const mainTeam = teams.find((team) => team.isMain) || null;

    const gamesFromActiveTournament = games.filter(
      (game) => game.tournamentId === tournamentData.id
    );

    const standings = getHybridTournamentTable({
      manualStandings: tournamentData.standings,
      games: gamesFromActiveTournament,
      mainTeam,
    });

    return {
      ...tournamentData,
      standings,
    };
  }, []);

  const { data: tournament, loading, error, refetch } = useFetchData(fetcher, {
    initialData: null,
    errorContext: {
      page: "Table",
      action: "load_table",
    },
  });

  return { tournament, loading, error: Boolean(error), refetch };
};
