import { useEffect, useState } from "react";
import {
  getNews,
  getTable,
  getGame,
  getTopScorers,
} from "../../../lib/sanity";
import { sortNews } from "../../../utils/news.utils";


export const useHomeData = () => {
  const [data, setData] = useState({
    news: [],
    topScorers: [],
    table: null,
    game: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const year = new Date().getFullYear();

        const [newsRes, scorersRes, tableRes, gameRes] =
          await Promise.all([
            getNews(),
            getTopScorers(year),
            getTable(),
            getGame(),
          ]);

        setData({
          news: sortNews(newsRes),
          topScorers: scorersRes,
          table: tableRes,
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
