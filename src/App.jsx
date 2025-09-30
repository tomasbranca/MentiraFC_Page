import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import News from "./pages/News/News";
import Team from "./pages/Team/Team";
import Table from "./pages/Table/Table";
import Record from "./pages/Record/Record";
import NavBar from "./components/NavBar/NavBar";
import { ROUTES } from "./utils/routes";
import "./App.css";

function App() {
  return (
    <>
      <NavBar />
      <div className="pt-24 bg-violet-50 min-h-screen">
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.NEWS} element={<News />} />
          <Route path={ROUTES.TEAM} element={<Team />} />
          <Route path={ROUTES.TABLE} element={<Table />} />
          <Route path={ROUTES.RECORD} element={<Record />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
