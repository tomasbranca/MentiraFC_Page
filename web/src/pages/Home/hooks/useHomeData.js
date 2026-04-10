import { useCallback } from "react";

import { getNews } from "../../../data/news";
import { getTournament } from "../../../data/tournament";
import { getAllGames, getTournamentGames } from "../../../data/games";
import { getPlayers } from "../../../data/players";
import { getTeams } from "../../../data/sanity/services/teams.service";

import { sortNews } from "../../../utils/news.utils";
import { getHybridTournamentTable, getTopScorers } from "../../../domain/stats";
import { useFetchData } from "../../../hooks/useFetchData";

export const useHomeData = () => {
  const fetcher = useCallback(async () => {
    const year = new Date().getFullYear();

    const [
      newsRes,
      playersRes,
      finishedGamesRes,
      tournamentRes,
      teamsRes,
      finishedTournamentGamesRes,
    ] = await Promise.all([
      getNews(),
      getPlayers(),
      getAllGames(),
      getTournament(),
      getTeams(),
      getTournamentGames(),
    ]);

    const topScorers = getTopScorers(finishedGamesRes, playersRes, { year });

    const mainTeam = teamsRes.find((team) => team.isMain) || null;

    const gamesFromActiveTournament = (finishedTournamentGamesRes || []).filter(
      (game) => game.tournamentId === tournamentRes?.id
    );

    const hybridTournament = tournamentRes
      ? {
          ...tournamentRes,
          standings: getHybridTournamentTable({
            manualStandings: tournamentRes.standings,
            games: gamesFromActiveTournament,
            mainTeam,
          }),
        }
      : null;

    return {
      news: sortNews(newsRes),
      topScorers,
      tournament: hybridTournament,
    };
  }, []);

  const { data, loading, error, refetch } = useFetchData(fetcher, {
    initialData: {
      news: [],
      topScorers: [],
      tournament: null,
    },
    errorContext: {
      page: "Home",
      action: "load_home_data",
    },
  });

  return { ...data, loading, error: Boolean(error), refetch };
};
