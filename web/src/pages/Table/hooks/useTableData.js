import { useEffect, useState } from "react";
import { getTournament } from "../../../data/tournament";
import { getTeams } from "../../../lib/sanity/services/teams.service";
import { getTournamentGames } from "../../../data/games";
import { getHybridTournamentTable } from "../../../lib/domain/stats";

export const useTableData = () => {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getTournament(), getTeams(), getTournamentGames()])
      .then(([tournamentData, teams, games]) => {
        if (!tournamentData) {
          setTournament(null);
          return;
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

        setTournament({
          ...tournamentData,
          standings,
        });
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { tournament, loading, error };
};
