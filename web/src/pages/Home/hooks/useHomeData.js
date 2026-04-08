import { useEffect, useState } from "react";

import { getNews } from "../../../lib/sanity/services/news.service";
import { getTournament } from "../../../lib/sanity/services/tournaments.service";
import { getLatestGame, getFinishedGames } from "../../../lib/sanity/services/games.service";
import { getPlayers } from "../../../lib/sanity/services/players.service";

import { sortNews } from "../../../utils/news.utils";
import { getTopScorers } from "../../../lib/domain/stats";

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

        const [newsRes, playersRes, finishedGamesRes, tournamentRes, gameRes] =
          await Promise.all([
            getNews(),
            getPlayers(),
            getFinishedGames(),
            getTournament(),
            getLatestGame(),
          ]);

        const topScorers = getTopScorers(finishedGamesRes, playersRes, { year });

        setData({
          news: sortNews(newsRes),
          topScorers,
          tournament: tournamentRes,
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
