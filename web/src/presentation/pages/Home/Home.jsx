import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import Loader from "../../components/Loader/Loader";
import ErrorFallback from "../../components/errors/ErrorFallback";
import { useGame } from "../../context/useGame";

import { useHomeData } from "./hooks/useHomeData";

const Home = () => {
  const { news, topScorers, tournament, loading, error, refetch } = useHomeData();
  const { game, loading: gameLoading } = useGame();

  if (loading) return <Loader />;
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
