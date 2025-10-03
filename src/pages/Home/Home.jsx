import "./Home.css";
import LatestNews from "../../components/LatestNews/LatestNews";
import TopScorers from "../../components/TopScorers/TopScorers";
import TableWidget from "../../components/TableWidget/TableWidget";
import { news } from "../../utils/newsMock";
import { players } from "../../utils/playersMock";
import { table } from "../../utils/tableMock";

const Home = () => {
  return (
    <div>
      <div className="news bg-violet-900 text-violet-50 shadow-black/30 shadow-lg">
        <LatestNews news={news}/>
      </div>
      <div className="scorers-table grid grid-cols-3">
        <TopScorers players={players} />
        <TableWidget table={table} />
      </div>
    </div>
  );
};

export default Home;
