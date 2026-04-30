import { Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import type { InitialDataPayload } from "./data/getInitialData";
import Loader from "./presentation/components/Loader/Loader";
import { GameProvider } from "./presentation/context/GameProvider";
import { InitialDataProvider } from "./presentation/context/InitialDataContext";
import Footer from "./presentation/layout/Footer/Footer";
import NavBar from "./presentation/layout/NavBar/NavBar";
import Home from "./presentation/pages/Home/Home";
import { ROUTES } from "./presentation/constants/routes.constants";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazyWithReload } from "./lib/lazyWithReload";

import "./App.css";

type AppProps = {
  initialData: InitialDataPayload;
};

const News = lazyWithReload(() => import("./presentation/pages/News/News"));
const Team = lazyWithReload(() => import("./presentation/pages/Team/Team"));
const Table = lazyWithReload(() => import("./presentation/pages/Table/Table"));
const Record = lazyWithReload(() => import("./presentation/pages/Record/Record"));
const Admin = lazyWithReload(() => import("./presentation/pages/Admin/Admin"));
const NewsDetail = lazyWithReload(
  () => import("./presentation/pages/NewsDetail/NewsDetail"),
);
const PlayerDetail = lazyWithReload(
  () => import("./presentation/pages/PlayerDetail/PlayerDetail"),
);

function App({ initialData }: AppProps) {
  const enableAnalytics =
    import.meta.env.VITE_ENABLE_ANALYTICS === "true";

  useEffect(() => {
    const loadDeferredStyles = () => {
      void import("./presentation/app/nonCritical.css");
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadDeferredStyles);

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(loadDeferredStyles, 1);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <InitialDataProvider initialData={initialData}>
      {enableAnalytics && <Analytics />}
      {enableAnalytics && <SpeedInsights />}

      <GameProvider>
        <NavBar />

        <div className="border-t-96 border-t-violet-900 min-h-screen">
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path={ROUTES.HOME} element={<Home />} />
              <Route path={ROUTES.NEWS} element={<News />} />
              <Route path={ROUTES.TEAM} element={<Team />} />
              <Route path={ROUTES.TABLE} element={<Table />} />
              <Route path={ROUTES.RECORD} element={<Record />} />
              <Route path={ROUTES.ADMIN} element={<Admin />} />
              <Route
                path={ROUTES.NEWS_DETAIL(":slug")}
                element={<NewsDetail />}
              />
              <Route
                path={ROUTES.PLAYER_DETAIL(":slug")}
                element={<PlayerDetail />}
              />
            </Routes>
          </Suspense>
        </div>

        <Footer />
      </GameProvider>
    </InitialDataProvider>
  );
}

export default App;
