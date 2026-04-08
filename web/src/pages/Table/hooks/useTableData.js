import { useEffect, useState } from "react";
import { getTournament } from "../../../lib/sanity/services/tournaments.service";
import { getTeams } from "../../../lib/sanity/services/teams.service";
import { getFinishedTournamentGames } from "../../../lib/sanity/services/games.service";
import { getTournamentTable } from "../../../lib/domain/stats";

export const useTableData = () => {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getTournament(), getTeams(), getFinishedTournamentGames()])
      .then(([tournamentData, teams, games]) => {
        const standings = getTournamentTable(games, teams);

        if (!tournamentData) {
          setTournament(null);
          return;
        }

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
