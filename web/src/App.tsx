import { Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import type { InitialDataPayload } from "./data/getInitialData";
import ErrorFallback from "./presentation/components/errors/ErrorFallback";
import Loader from "./presentation/components/Loader/Loader";
import { GameProvider } from "./presentation/context/GameProvider";
import { InitialDataProvider } from "./presentation/context/InitialDataContext";
import Footer from "./presentation/layout/Footer/Footer";
import NavBar from "./presentation/layout/NavBar/NavBar";
import { ROUTES } from "./presentation/constants/routes.constants";
import RouteHead from "./presentation/seo/RouteHead";

import { lazyWithReload } from "./lib/lazyWithReload";

import "./App.css";

type AppProps = {
  initialData: InitialDataPayload;
};

const Home = lazyWithReload(() => import("./presentation/pages/Home/Home"));
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
const StaffDetail = lazyWithReload(
  () => import("./presentation/pages/StaffDetail/StaffDetail"),
);
const Analytics = lazyWithReload(() =>
  import("@vercel/analytics/react").then(({ Analytics }) => ({
    default: Analytics,
  }))
);
const SpeedInsights = lazyWithReload(() =>
  import("@vercel/speed-insights/react").then(({ SpeedInsights }) => ({
    default: SpeedInsights,
  }))
);

function App({ initialData }: AppProps) {
  const enableAnalytics =
    import.meta.env.VITE_ENABLE_ANALYTICS === "true";
  const hasBootstrapError = initialData.bootstrapScope === "bootstrap-error";

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

  const handleBootstrapRetry = () => {
    window.location.reload();
  };

  return (
    <InitialDataProvider initialData={initialData}>
      {enableAnalytics && (
        <Suspense fallback={null}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      )}

      <GameProvider>
        <RouteHead />
        <NavBar />

        <div className="border-t-96 border-t-violet-900 min-h-screen">
          {hasBootstrapError ? (
            <ErrorFallback
              title="No pudimos cargar la pagina"
              message={initialData.bootstrapError?.message}
              onRetry={handleBootstrapRetry}
              retryLabel="Volver a intentar"
            />
          ) : (
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
                  path={ROUTES.STAFF_DETAIL(":slug")}
                  element={<StaffDetail />}
                />
                <Route
                  path={ROUTES.PLAYER_DETAIL(":slug")}
                  element={<PlayerDetail />}
                />
              </Routes>
            </Suspense>
          )}
        </div>

        <Footer />
      </GameProvider>
    </InitialDataProvider>
  );
}

export default App;
