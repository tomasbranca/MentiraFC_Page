// @ts-nocheck
import { useMemo } from "react";

import { getHybridTournamentTable, getTopScorers } from "../../../../domain/stats";
import { useInitialData } from "../../../context/InitialDataContext";
import { sortNews } from "../../../utils/news.utils";

export const useHomeData = () => {
  const { initialData } = useInitialData();
  const year = new Date().getFullYear();

  const homeData = useMemo(() => {
    const topScorers = getTopScorers(initialData.games, initialData.players, {
      year,
    });

    const mainTeam = initialData.teams.find((team) => team.isMain) || null;

    const gamesFromActiveTournament = initialData.tournamentGames.filter(
      (nextGame) => nextGame.tournamentId === initialData.tournament?.id
    );

    const tournament = initialData.tournament
      ? {
          ...initialData.tournament,
          standings: getHybridTournamentTable({
            manualStandings: initialData.tournament.standings,
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
  }, [initialData, year]);

  return {
    ...homeData,
    year,
  };
};
