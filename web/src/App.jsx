import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import News from "./pages/News/News";
import Team from "./pages/Team/Team";
import Table from "./pages/Table/Table";
import Record from "./pages/Record/Record";
import Admin from "./pages/Admin/Admin";
import NewsDetail from "./pages/NewsDetail/NewsDetail";
import NavBar from "./layout/NavBar/NavBar";
import Footer from "./layout/Footer/Footer";
import { ROUTES } from "./utils/routes";
import "./App.css";

function App() {
  return (
    <>
      <NavBar />
      <div className="pt-24 min-h-screen">
      <div className="absolute inset-0 bg-pattern-only pointer-events-none"></div>
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.NEWS} element={<News />} />
          <Route path={ROUTES.TEAM} element={<Team />} />
          <Route path={ROUTES.TABLE} element={<Table />} />
          <Route path={ROUTES.RECORD} element={<Record />} />
          <Route path={ROUTES.ADMIN} element={<Admin />} />
          <Route path={ROUTES.NEWS_DETAIL} element={<NewsDetail />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
