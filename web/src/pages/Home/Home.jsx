import { useEffect, useState } from "react";
import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import Loader from "../../components/Loader/Loader";

import {
  getNews,
  getTable,
  getGame,
  getTopScorers, // 🔥 NUEVO
} from "../../lib/sanity";

const Home = () => {
  const [news, setNews] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [table, setTable] = useState(null);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingGame, setLoadingGame] = useState(true);

  useEffect(() => {
    const loadHome = async () => {
      try {
        const year = new Date().getFullYear();

        const [newsRes, scorersRes, tableRes, gameRes] =
          await Promise.all([
            getNews(),
            getTopScorers(year),
            getTable(),
            getGame(),
          ]);

        // noticias
        setNews(
          [...newsRes].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )
        );

        // goleadores (ya vienen ordenados y calculados)
        setTopScorers(scorersRes);

        // tabla
        setTable(tableRes);

        // partido
        setGame(gameRes);
        setLoadingGame(false);
      } finally {
        setLoading(false);
      }
    };

    loadHome();
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      <div className="bg-violet-900 text-violet-50">
        <LatestNews news={news} />
      </div>

      <Game game={game} loading={loadingGame} />

      <div className="relative grid grid-cols-1 lg:grid-cols-3">
        <TopScorers players={topScorers} />
        <TableWidget table={table} />
      </div>
    </>
  );
};

export default Home;