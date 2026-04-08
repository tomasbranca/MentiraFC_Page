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
        if (!tournamentData) {
          setTournament(null);
          return;
        }

        const teamIdsInTournament = new Set(
          (tournamentData.standings || []).map((row) => row.team.id)
        );

        const scopedTeams = teams.filter((team) => teamIdsInTournament.has(team.id));

        const scopedGames = games.filter(
          (game) =>
            game.tournamentId === tournamentData.id &&
            teamIdsInTournament.has(game.rival?.id)
        );

        const standings = getTournamentTable(scopedGames, scopedTeams);

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
