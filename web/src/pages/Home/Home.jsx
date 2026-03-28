import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import Loader from "../../components/Loader/Loader";

import { useHomeData } from "./hooks/useHomeData";

const Home = () => {
  const { news, topScorers, table, game, loading } =
    useHomeData();

  if (loading) return <Loader />;

  return (
    <>
      <div className="bg-violet-900 text-violet-50">
        <LatestNews news={news} />
      </div>

      <Game game={game} />

      <div className="relative grid grid-cols-1 lg:grid-cols-3">
        <TopScorers players={topScorers} />
        <TableWidget table={table} />
      </div>
    </>
  );
};

export default Home;