import "./Home.css";
import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";
import { players } from "../../utils/playersMock";
import { table } from "../../utils/tableMock";

const Home = () => {
  return (
    <div>
      <div className="news bg-violet-900 text-violet-50 shadow-black/30 shadow-lg">
        <LatestNews />
      </div>
      <Game />
      <div className="scorers-table grid grid-cols-3">
        <TopScorers players={players} />
        <TableWidget table={table} />
      </div>
    </div>
  );
};

export default Home;
