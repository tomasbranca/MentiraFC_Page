// @ts-nocheck
import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import { useGame } from "../../context/useGame";
import { useHomeData } from "./hooks/useHomeData";

const Home = () => {
  const { game, loading: gameLoading } = useGame();
  const { news, topScorers, tournament } = useHomeData();

  return (
    <>
      <div className="bg-violet-900 text-violet-50">
        <LatestNews news={news} />
      </div>

      <Game game={game} loading={gameLoading} />

      <div className="relative grid grid-cols-1 lg:grid-cols-3">
        <TopScorers players={topScorers} />
        <TableWidget table={tournament} />
      </div>
    </>
  );
};

export default Home;
