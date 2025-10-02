import "./Home.css";
import LatestNews from "../../components/LatestNews/LatestNews";
import TopScorers from "../../components/TopScorers/TopScorers";
import { news } from "../../utils/newsMock";
import { players } from "../../utils/playersMock";

const Home = () => {
  return (
    <div>
      <div className="news bg-violet-900 text-violet-50">
        <LatestNews news={news}/>
      </div>
      <div className="scorers-table grid grid-cols-3">
        <TopScorers players={players} />
      </div>
    </div>
  );
};

export default Home;
