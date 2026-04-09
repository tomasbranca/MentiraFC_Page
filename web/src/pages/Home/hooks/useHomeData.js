import { useEffect, useState } from "react";

import { getNews } from "../../../data/news";
import { getTournament } from "../../../data/tournament";
import { getAllGames, getTournamentGames } from "../../../data/games";
import { getPlayers } from "../../../data/players";
import { getTeams } from "../../../lib/sanity/services/teams.service";

import { sortNews } from "../../../utils/news.utils";
import { getHybridTournamentTable, getTopScorers } from "../../../lib/domain/stats";

export const useHomeData = () => {
  const [data, setData] = useState({
    news: [],
    topScorers: [],
    tournament: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
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

        setData({
          news: sortNews(newsRes),
          topScorers,
          tournament: hybridTournament,
        });
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { ...data, loading, error };
};
