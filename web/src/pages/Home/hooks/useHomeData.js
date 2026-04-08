import { useEffect, useState } from "react";

import { getNews } from "../../../lib/sanity/services/news.service";
import { getTournament } from "../../../lib/sanity/services/tournaments.service";
import {
  getLatestGame,
  getFinishedGames,
  getFinishedTournamentGames,
} from "../../../lib/sanity/services/games.service";
import { getPlayers } from "../../../lib/sanity/services/players.service";
import { getTeams } from "../../../lib/sanity/services/teams.service";

import { sortNews } from "../../../utils/news.utils";
import { getHybridTournamentTable, getTopScorers } from "../../../lib/domain/stats";

export const useHomeData = () => {
  const [data, setData] = useState({
    news: [],
    topScorers: [],
    tournament: null,
    game: null,
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
          gameRes,
          teamsRes,
          finishedTournamentGamesRes,
        ] = await Promise.all([
          getNews(),
          getPlayers(),
          getFinishedGames(),
          getTournament(),
          getLatestGame(),
          getTeams(),
          getFinishedTournamentGames(),
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
          game: gameRes,
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
