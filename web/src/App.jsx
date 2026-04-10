import { Routes, Route } from "react-router-dom";
import Home from "./presentation/pages/Home/Home";
import News from "./presentation/pages/News/News";
import Team from "./presentation/pages/Team/Team";
import Table from "./presentation/pages/Table/Table";
import Record from "./presentation/pages/Record/Record";
import Admin from "./presentation/pages/Admin/Admin";
import NewsDetail from "./presentation/pages/NewsDetail/NewsDetail";
import PlayerDetail from "./presentation/pages/PlayerDetail/PlayerDetail";
import NavBar from "./presentation/layout/NavBar/NavBar";
import Footer from "./presentation/layout/Footer/Footer";
import { GameProvider } from "./presentation/context/GameProvider";
import { ROUTES } from "./presentation/constants/routes.constants";
import "./App.css";

function App() {
  return (
    <>
      <GameProvider>
        <NavBar />
        <div className="border-t-96 border-t-violet-900 min-h-screen ">
          <div className="absolute inset-0 bg-pattern-only pointer-events-none"></div>
          <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.NEWS} element={<News />} />
            <Route path={ROUTES.TEAM} element={<Team />} />
            <Route path={ROUTES.TABLE} element={<Table />} />
            <Route path={ROUTES.RECORD} element={<Record />} />
            <Route path={ROUTES.ADMIN} element={<Admin />} />
            <Route path={ROUTES.NEWS_DETAIL(":slug")} element={<NewsDetail />} />
            <Route path={ROUTES.PLAYER_DETAIL(":slug")} element={<PlayerDetail />} />
          </Routes>
        </div>
        <Footer />
      </GameProvider>
    </>
  );
}

export default App;
