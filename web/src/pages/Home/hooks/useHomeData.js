import { useEffect, useState } from "react";

import { getNews } from "../../../lib/sanity/services/news.service";
import { getTournament } from "../../../lib/sanity/services/tournaments.service";
import { getLatestGame } from "../../../lib/sanity/services/games.service";
import { getTopScorers } from "../../../lib/sanity/services/players.service";

import { sortNews } from "../../../utils/news.utils";


export const useHomeData = () => {
  const [data, setData] = useState({
    news: [],
    topScorers: [],
    tournament: null,
    game: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const year = new Date().getFullYear();

        const [newsRes, scorersRes, tournamentRes, gameRes] =
          await Promise.all([
            getNews(),
            getTopScorers(year),
            getTournament(),
            getLatestGame(),
          ]);
        setData({
          news: sortNews(newsRes),
          topScorers: scorersRes,
          table: tournamentRes,
          game: gameRes,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { ...data, loading };
};
