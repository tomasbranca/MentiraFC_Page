// @ts-nocheck
import { lazy, Suspense } from "react";

import LatestNews from "../../features/main/LatestNews/LatestNews";
import Game from "../../features/main/Game/Game";
import Loader from "../../components/Loader/Loader";
import ErrorFallback from "../../components/errors/ErrorFallback";
import { useGame } from "../../context/useGame";

import { useHomeData } from "./hooks/useHomeData";

const TopScorers = lazy(() => import("../../features/main/TopScorers/TopScorers"));
const TableWidget = lazy(() => import("../../features/main/TableWidget/TableWidget"));

const BlockPlaceholder = ({ minHeight = "min-h-[240px]" }) => (
  <div className={`w-full ${minHeight} animate-pulse bg-violet-800/25`} />
);

const Home = () => {
  const {
    news,
    topScorers,
    tournament,
    loadingNews,
    loadingSecondary,
    error,
    secondaryError,
    refetch,
  } = useHomeData();
  const { game, loading: gameLoading } = useGame();

  if (error) {
    return (
      <ErrorFallback
        title="No se pudieron cargar los datos de inicio"
        message="Intentá nuevamente en unos minutos."
        onRetry={refetch}
      />
    );
  }

  return (
    <>
      <div className="bg-violet-900 text-violet-50">
        {loadingNews && !news.length ? (
          <div className="px-6 py-16">
            <Loader />
          </div>
        ) : (
          <LatestNews news={news} />
        )}
      </div>

      <Game game={game} loading={gameLoading} />

      <div className="relative grid grid-cols-1 lg:grid-cols-3">
        <Suspense fallback={<BlockPlaceholder />}>
          {loadingSecondary && !topScorers.length ? (
            <BlockPlaceholder />
          ) : (
            <TopScorers players={topScorers} />
          )}
        </Suspense>

        <Suspense fallback={<BlockPlaceholder minHeight="min-h-[420px]" />}>
          {loadingSecondary && !tournament ? (
            <BlockPlaceholder minHeight="min-h-[420px]" />
          ) : (
            <TableWidget table={tournament} />
          )}
        </Suspense>
      </div>

      {secondaryError ? (
        <div className="px-6 py-3 text-center text-xs text-violet-200">
          Algunas estadísticas tardaron más de lo esperado en cargar.
        </div>
      ) : null}
    </>
  );
};

export default Home;
