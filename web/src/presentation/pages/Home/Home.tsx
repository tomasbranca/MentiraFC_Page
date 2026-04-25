// @ts-nocheck
import { lazy, Suspense } from "react";
import LatestNews from "../../features/main/LatestNews/LatestNews";
import Game from "../../features/main/Game/Game";
import { useGame } from "../../context/useGame";
import { useHomeData } from "./hooks/useHomeData";

const TopScorers = lazy(
  () => import("../../features/main/TopScorers/TopScorers")
);
const TableWidget = lazy(
  () => import("../../features/main/TableWidget/TableWidget")
);

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
        <Suspense fallback={<div className="min-h-[28rem]" aria-hidden="true" />}>
          <TopScorers players={topScorers} />
        </Suspense>
        <Suspense fallback={<div className="min-h-[28rem]" aria-hidden="true" />}>
          <TableWidget table={tournament} />
        </Suspense>
      </div>
    </>
  );
};

export default Home;
