import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import Loader from "../../components/Loader/Loader";
import { useGame } from "../../context/useGame";

import { useHomeData } from "./hooks/useHomeData";

const Home = () => {
  const { news, topScorers, tournament, loading, error } = useHomeData();
  const { game, loading: gameLoading } = useGame();

  if (loading) return <Loader />;
  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <p className="rounded-md border border-red-500/40 bg-red-900/20 p-4 text-red-100">
          No se pudieron cargar los datos de inicio. Intentá nuevamente en unos minutos.
        </p>
      </main>
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
