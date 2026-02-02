import LatestNews from "../../features/main/LatestNews/LatestNews";
import TopScorers from "../../features/main/TopScorers/TopScorers";
import TableWidget from "../../features/main/TableWidget/TableWidget";
import Game from "../../features/main/Game/Game";

const Home = () => {
  return (
    <>
      <div className="bg-violet-900 text-violet-50 shadow-black/30 shadow-lg">
        <LatestNews />
      </div>
      <Game />
      <div className="relative grid grid-cols-3">
        <TopScorers />
        <TableWidget />
      </div>
    </>
  );
};

export default Home;
