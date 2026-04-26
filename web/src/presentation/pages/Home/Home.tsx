// @ts-nocheck
import { lazy, Suspense } from "react";
import LatestNews from "../../features/main/LatestNews/LatestNews";
import { useGame } from "../../context/useGame";
import { useHomeData } from "./hooks/useHomeData";

const Game = lazy(() => import("../../features/main/Game/Game"));
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

      <Suspense fallback={<div className="min-h-[20rem]" aria-hidden="true" />}>
        <Game game={game} loading={gameLoading} />
      </Suspense>

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
