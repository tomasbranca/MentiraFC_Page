import { Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import type { InitialDataPayload } from "./data/getInitialData";
import ErrorFallback from "./presentation/components/errors/ErrorFallback";
import Loader from "./presentation/components/Loader/Loader";
import { GameProvider } from "./presentation/context/GameProvider";
import { InitialDataProvider } from "./presentation/context/InitialDataContext";
import Footer from "./presentation/layout/Footer/Footer";
import NavBar from "./presentation/layout/NavBar/NavBar";
import { ROUTES } from "./shared/routing";
import RouteHead from "./presentation/seo/RouteHead";
import Home from "./presentation/pages/Home/Home";
import RequireAuth from "./presentation/routing/RequireAuth";
import RequirePermission from "./presentation/routing/RequirePermission";

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
const Account = lazyWithReload(
  () => import("./presentation/pages/Account/Account")
);
const DashboardLayout = lazyWithReload(
  () => import("./presentation/layout/DashboardLayout/DashboardLayout")
);
const DashboardHome = lazyWithReload(
  () => import("./presentation/pages/Dashboard/DashboardHome")
);
const DashboardNewsList = lazyWithReload(
  () => import("./presentation/pages/DashboardNews/DashboardNewsList")
);
const DashboardNewsForm = lazyWithReload(
  () => import("./presentation/pages/DashboardNews/DashboardNewsForm")
);
const DashboardMatchesList = lazyWithReload(
  () => import("./presentation/pages/DashboardMatches/DashboardMatchesList")
);
const DashboardMatchesForm = lazyWithReload(
  () => import("./presentation/pages/DashboardMatches/DashboardMatchesForm")
);
const DashboardTableList = lazyWithReload(
  () => import("./presentation/pages/DashboardTable/DashboardTableList")
);
const DashboardTableForm = lazyWithReload(
  () => import("./presentation/pages/DashboardTable/DashboardTableForm")
);
const DashboardTournamentsList = lazyWithReload(
  () => import("./presentation/pages/DashboardTournaments/DashboardTournamentsList")
);
const DashboardTournamentsForm = lazyWithReload(
  () => import("./presentation/pages/DashboardTournaments/DashboardTournamentsForm")
);
const DashboardOrganizationsList = lazyWithReload(
  () => import("./presentation/pages/DashboardOrganizations/DashboardOrganizationsList")
);
const DashboardOrganizationsForm = lazyWithReload(
  () => import("./presentation/pages/DashboardOrganizations/DashboardOrganizationsForm")
);
const DashboardPlayersList = lazyWithReload(
  () => import("./presentation/pages/DashboardPlayers/DashboardPlayersList")
);
const DashboardPlayersForm = lazyWithReload(
  () => import("./presentation/pages/DashboardPlayers/DashboardPlayersForm")
);
const DashboardStaffForm = lazyWithReload(
  () => import("./presentation/pages/DashboardPlayers/DashboardStaffForm")
);
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
                  path={ROUTES.ACCOUNT}
                  element={
                    <RequireAuth>
                      <Account />
                    </RequireAuth>
                  }
                />
                <Route
                  path={ROUTES.DASHBOARD}
                  element={
                    <RequirePermission permission="view_dashboard">
                      <DashboardLayout />
                    </RequirePermission>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route
                    path="noticias"
                    element={
                      <RequirePermission permission="manage_news">
                        <DashboardNewsList />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="noticias/nueva"
                    element={
                      <RequirePermission permission="manage_news">
                        <DashboardNewsForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="noticias/:id"
                    element={
                      <RequirePermission permission="manage_news">
                        <DashboardNewsForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="partidos"
                    element={
                      <RequirePermission permission="manage_matches">
                        <DashboardMatchesList />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="partidos/nuevo"
                    element={
                      <RequirePermission permission="manage_matches">
                        <DashboardMatchesForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="partidos/:id"
                    element={
                      <RequirePermission permission="manage_matches">
                        <DashboardMatchesForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="tabla"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardTableList />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="tabla/nueva"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardTableForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="tabla/:id"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardTableForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="torneos"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardTournamentsList />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="torneos/nuevo"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardTournamentsForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="torneos/:id"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardTournamentsForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="organizadores"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardOrganizationsList />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="organizadores/nuevo"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardOrganizationsForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="organizadores/:id"
                    element={
                      <RequirePermission permission="manage_tables">
                        <DashboardOrganizationsForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="jugadores"
                    element={
                      <RequirePermission permission="manage_team_members">
                        <DashboardPlayersList />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="jugadores/nuevo"
                    element={
                      <RequirePermission permission="manage_team_members">
                        <DashboardPlayersForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="jugadores/staff/nuevo"
                    element={
                      <RequirePermission permission="manage_team_members">
                        <DashboardStaffForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="jugadores/staff/:id"
                    element={
                      <RequirePermission permission="manage_team_members">
                        <DashboardStaffForm />
                      </RequirePermission>
                    }
                  />
                  <Route
                    path="jugadores/:id"
                    element={
                      <RequirePermission permission="manage_team_members">
                        <DashboardPlayersForm />
                      </RequirePermission>
                    }
                  />
                </Route>
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
