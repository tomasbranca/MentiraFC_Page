import { Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import type { InitialDataPayload } from "./data/getInitialData";
import ErrorFallback from "./presentation/components/errors/ErrorFallback";
import Loader from "./presentation/components/Loader/Loader";
import { GameProvider } from "./presentation/context/GameProvider";
import { InitialDataProvider } from "./presentation/context/InitialDataContext";
import Footer from "./presentation/layout/Footer/Footer";
import NavBar from "./presentation/layout/NavBar/NavBar";
import { ROUTES } from "./presentation/constants/routes.constants";
import RouteHead from "./presentation/seo/RouteHead";
import Home from "./presentation/pages/Home/Home";

import { lazyWithReload } from "./lib/lazyWithReload";

import "./App.css";

type AppProps = {
  initialData: InitialDataPayload;
};

const News = lazyWithReload(() => import("./presentation/pages/News/News"));
const Gallery = lazyWithReload(() => import("./presentation/pages/Gallery/Gallery"));
const Team = lazyWithReload(() => import("./presentation/pages/Team/Team"));
const Table = lazyWithReload(() => import("./presentation/pages/Table/Table"));
const Record = lazyWithReload(() => import("./presentation/pages/Record/Record"));
const Login = lazyWithReload(() => import("./presentation/pages/Login/Login"));
const NewsDetail = lazyWithReload(
  () => import("./presentation/pages/NewsDetail/NewsDetail"),
);
const GalleryDetail = lazyWithReload(
  () => import("./presentation/pages/GalleryDetail/GalleryDetail"),
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
  const { pathname } = useLocation();
  const enableAnalytics =
    import.meta.env.VITE_ENABLE_ANALYTICS === "true";
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false);
  const hasBootstrapError = initialData.bootstrapScope === "bootstrap-error";
  const isAuthRoute = pathname === ROUTES.LOGIN;

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

  useEffect(() => {
    if (!enableAnalytics) return;

    const loadAnalytics = () => setShouldLoadAnalytics(true);

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadAnalytics, {
        timeout: 3000,
      });

      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(loadAnalytics, 3000);

    return () => clearTimeout(timeoutId);
  }, [enableAnalytics]);

  const handleBootstrapRetry = () => {
    window.location.reload();
  };

  return (
    <InitialDataProvider initialData={initialData}>
      {shouldLoadAnalytics && (
        <Suspense fallback={null}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      )}

      <GameProvider>
        <RouteHead />
        {!isAuthRoute && <NavBar />}

        <main
          className={
            isAuthRoute
              ? "min-h-screen"
              : "border-t-96 border-t-violet-900 min-h-screen"
          }
        >
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
                <Route path={ROUTES.GALLERY} element={<Gallery />} />
                <Route path={ROUTES.TEAM} element={<Team />} />
                <Route path={ROUTES.TABLE} element={<Table />} />
                <Route path={ROUTES.RECORD} element={<Record />} />
                <Route path={ROUTES.LOGIN} element={<Login />} />
                <Route
                  path={ROUTES.NEWS_DETAIL(":slug")}
                  element={<NewsDetail />}
                />
                <Route
                  path={ROUTES.GALLERY_DETAIL(":slug")}
                  element={<GalleryDetail />}
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
        </main>

        {!isAuthRoute && <Footer />}
      </GameProvider>
    </InitialDataProvider>
  );
}

export default App;
