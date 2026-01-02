import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import { players } from "../../utils/playersMock";
import { table } from "../../utils/tableMock";

const Home = () => {
  return (
    <>
      <div className="bg-violet-900 text-violet-50 shadow-black/30 shadow-lg">
        <LatestNews />
      </div>
      <Game />
      <div className="relative grid grid-cols-3">
        <TopScorers players={players} />
        <TableWidget table={table} />
      </div>
    </>
  );
};

export default Home;
