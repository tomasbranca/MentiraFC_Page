import { useEffect, useState } from "react";
import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import Loader from "../../components/Loader/Loader";

import {
  getNews,
  getPlayers,
  getTable,
  getGame,
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
        const [newsRes, playersRes, tableRes, gameRes] =
          await Promise.all([
            getNews(),
            getPlayers(),
            getTable(),
            getGame(),
          ]);

        // noticias
        setNews(
          [...newsRes].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )
        );

        // goleadores
        setTopScorers(
          playersRes
            .filter((p) => p.goals && p.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 4)
        );

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

      <div className="relative grid grid-cols-3">
        <TopScorers players={topScorers} />
        <TableWidget table={table} />
      </div>
    </>
  );
};

export default Home;
