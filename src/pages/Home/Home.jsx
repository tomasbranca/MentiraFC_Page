import "./Home.css";
import LatestNews from "../../components/LatestNews/LatestNews";
import { news } from "../../utils/newsMock";

const Home = () => {
  return (
    <div>
      <div className="news bg-violet-900 text-violet-50">
        <LatestNews news={news}/>
      </div>
    </div>
  );
};

export default Home;
