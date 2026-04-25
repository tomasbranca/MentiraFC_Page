// @ts-nocheck
import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import { useGame } from "../../context/useGame";
import { useInitialData } from "../../context/InitialDataContext";
import { sortNews } from "../../utils/news.utils";
import { getHybridTournamentTable, getTopScorers } from "../../../domain/stats";

const Home = () => {
  const { game, loading: gameLoading } = useGame();
  const { initialData } = useInitialData();
  const year = new Date().getFullYear();

  const topScorers = getTopScorers(initialData.games, initialData.players, {
    year,
  });

  const mainTeam = initialData.teams.find((team) => team.isMain) || null;

  const gamesFromActiveTournament = initialData.tournamentGames.filter(
    (nextGame) => nextGame.tournamentId === initialData.tournament?.id
  );

  const tournament = initialData.tournament
    ? {
        ...initialData.tournament,
        standings: getHybridTournamentTable({
          manualStandings: initialData.tournament.standings,
          games: gamesFromActiveTournament,
          mainTeam,
        }),
      }
    : null;

  return (
    <>
      <div className="bg-violet-900 text-violet-50">
        <LatestNews news={sortNews(initialData.news)} />
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
