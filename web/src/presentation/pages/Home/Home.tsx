import { Suspense } from "react";
import Game from "../../features/main/Game/Game";
import LatestNews from "../../features/main/LatestNews/LatestNews";
import Loader from "../../components/Loader/Loader";
import { useGame } from "../../context/useGame";
import { useInitialData } from "../../context/useInitialData";
import { lazyWithReload } from "../../../lib/lazyWithReload";
import {
  TableWidgetSkeleton,
  TopScorersSkeleton,
} from "../../components/Skeletons/SectionSkeletons";
import { useHomeData } from "./hooks/useHomeData";

const TopScorers = lazyWithReload(
  () => import("../../features/main/TopScorers/TopScorers")
);
const TableWidget = lazyWithReload(
  () => import("../../features/main/TableWidget/TableWidget")
);

const Home = () => {
  const { initialData, isHomeCriticalLoading } = useInitialData();
  const { game, loading: gameLoading } = useGame();
  const { news, topScorers, tournament } = useHomeData();

  const isHomeLoading =
    initialData.bootstrapScope === "empty" || isHomeCriticalLoading;

  if (isHomeLoading) {
    return <Loader />;
  }

  return (
    <>
      <div className="bg-violet-900 text-violet-50">
        <LatestNews news={news} />
      </div>

      <Game game={game} loading={gameLoading} />

      <div className="relative grid grid-cols-1 lg:grid-cols-3">
        <Suspense fallback={<TopScorersSkeleton />}>
          <TopScorers players={topScorers} />
        </Suspense>
        <Suspense fallback={<TableWidgetSkeleton />}>
          <TableWidget table={tournament} />
        </Suspense>
      </div>
    </>
  );
};

export default Home;
