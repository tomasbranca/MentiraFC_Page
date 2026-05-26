import { Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

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
import RequireDashboardPermission from "./presentation/routing/RequireDashboardPermission";
import RequirePermission from "./presentation/routing/RequirePermission";
import { PERMISSIONS } from "./domain/auth/permissions";

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
const PasswordResetRequest = lazyWithReload(() =>
  import("./presentation/pages/Login/Login").then(({ default: LoginPage }) => ({
    default: () => <LoginPage initialMode="resetPassword" />,
  }))
);
const PasswordResetUpdate = lazyWithReload(() =>
  import("./presentation/pages/Login/Login").then(({ default: LoginPage }) => ({
    default: () => <LoginPage initialMode="updatePassword" />,
  }))
);
const Account = lazyWithReload(
  () => import("./presentation/pages/Account/Account")
);
const DashboardLayout = lazyWithReload(
  () => import("./presentation/layout/DashboardLayout/DashboardLayout")
);
const AdminLayout = lazyWithReload(
  () => import("./presentation/layout/AdminLayout/AdminLayout")
);
const AdminHome = lazyWithReload(
  () => import("./presentation/pages/Admin/AdminHome")
);
const AdminCommentReports = lazyWithReload(
  () => import("./presentation/pages/AdminCommentReports/AdminCommentReports")
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
const DashboardGalleriesList = lazyWithReload(
  () => import("./presentation/pages/DashboardGalleries/DashboardGalleriesList")
);
const DashboardGalleriesForm = lazyWithReload(
  () => import("./presentation/pages/DashboardGalleries/DashboardGalleriesForm")
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
const DashboardTeamsList = lazyWithReload(
  () => import("./presentation/pages/DashboardTeams/DashboardTeamsList")
);
const DashboardTeamsForm = lazyWithReload(
  () => import("./presentation/pages/DashboardTeams/DashboardTeamsForm")
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
const AppToaster = lazyWithReload(() => import("./presentation/app/AppToaster"));

function App({ initialData }: AppProps) {
  const { pathname } = useLocation();
  const normalizedPathname =
    pathname === ROUTES.HOME ? pathname : pathname.replace(/\/+$/, "");
  const enableAnalytics =
    import.meta.env.VITE_ENABLE_ANALYTICS === "true";
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false);
  const hasBootstrapError = initialData.bootstrapScope === "bootstrap-error";
  const isAuthRoute = [
    ROUTES.LOGIN,
    ROUTES.PASSWORD_RESET_REQUEST,
    ROUTES.PASSWORD_RESET_UPDATE,
  ].includes(normalizedPathname);
  const isAdminRoute =
    normalizedPathname === ROUTES.ADMIN ||
    normalizedPathname.startsWith(`${ROUTES.ADMIN}/`);
  const isStandaloneRoute = isAuthRoute || isAdminRoute;

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
        <Suspense fallback={null}>
          <AppToaster />
        </Suspense>
        <RouteHead />
        {!isStandaloneRoute && <NavBar />}

        <main
          className={
            isStandaloneRoute
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
                  path={ROUTES.PASSWORD_RESET_REQUEST}
                  element={<PasswordResetRequest />}
                />
                <Route
                  path={ROUTES.PASSWORD_RESET_UPDATE}
                  element={<PasswordResetUpdate />}
                />
                <Route
                  path={ROUTES.ACCOUNT}
                  element={
                    <RequireAuth requireAccount={false}>
                      <Account />
                    </RequireAuth>
                  }
                />
                <Route
                  path={ROUTES.ADMIN}
                  element={
                    <RequirePermission permission={PERMISSIONS.viewAdminPanel}>
                      <AdminLayout />
                    </RequirePermission>
                  }
                >
                  <Route index element={<AdminHome />} />
                  <Route
                    path="reportes-comentarios"
                    element={<AdminCommentReports />}
                  />
                </Route>
                <Route
                  path={ROUTES.DASHBOARD}
                  element={
                    <RequirePermission permission={PERMISSIONS.viewDashboard}>
                      <DashboardLayout />
                    </RequirePermission>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route
                    path="noticias"
                    element={
                      <RequireDashboardPermission resource="news" action="view">
                        <DashboardNewsList />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="noticias/nueva"
                    element={
                      <RequireDashboardPermission
                        resource="news"
                        action="create"
                      >
                        <DashboardNewsForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="noticias/:id"
                    element={
                      <RequireDashboardPermission resource="news" action="edit">
                        <DashboardNewsForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="partidos"
                    element={
                      <RequireDashboardPermission
                        resource="matches"
                        action="view"
                      >
                        <DashboardMatchesList />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="partidos/nuevo"
                    element={
                      <RequireDashboardPermission
                        resource="matches"
                        action="create"
                      >
                        <DashboardMatchesForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="partidos/:id"
                    element={
                      <RequireDashboardPermission
                        resource="matches"
                        action="edit"
                      >
                        <DashboardMatchesForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="galerias"
                    element={
                      <RequireDashboardPermission
                        resource="galleries"
                        action="view"
                      >
                        <DashboardGalleriesList />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="galerias/nueva"
                    element={
                      <RequireDashboardPermission
                        resource="galleries"
                        action="create"
                      >
                        <DashboardGalleriesForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="galerias/:id"
                    element={
                      <RequireDashboardPermission
                        resource="galleries"
                        action="edit"
                      >
                        <DashboardGalleriesForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="tabla"
                    element={
                      <RequireDashboardPermission resource="table" action="view">
                        <DashboardTableList />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="tabla/nueva"
                    element={
                      <RequireDashboardPermission
                        resource="table"
                        action="create"
                      >
                        <DashboardTableForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="tabla/:id"
                    element={
                      <RequireDashboardPermission resource="table" action="edit">
                        <DashboardTableForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="torneos"
                    element={
                      <RequireDashboardPermission
                        resource="tournaments"
                        action="view"
                      >
                        <DashboardTournamentsList />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="torneos/nuevo"
                    element={
                      <RequireDashboardPermission
                        resource="tournaments"
                        action="create"
                      >
                        <DashboardTournamentsForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="torneos/:id"
                    element={
                      <RequireDashboardPermission
                        resource="tournaments"
                        action="edit"
                      >
                        <DashboardTournamentsForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="organizadores"
                    element={
                      <RequireDashboardPermission
                        resource="organizations"
                        action="view"
                      >
                        <DashboardOrganizationsList />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="organizadores/nuevo"
                    element={
                      <RequireDashboardPermission
                        resource="organizations"
                        action="create"
                      >
                        <DashboardOrganizationsForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="organizadores/:id"
                    element={
                      <RequireDashboardPermission
                        resource="organizations"
                        action="edit"
                      >
                        <DashboardOrganizationsForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="clubes"
                    element={
                      <RequireDashboardPermission resource="teams" action="view">
                        <DashboardTeamsList />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="clubes/nuevo"
                    element={
                      <RequireDashboardPermission
                        resource="teams"
                        action="create"
                      >
                        <DashboardTeamsForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="clubes/:id"
                    element={
                      <RequireDashboardPermission resource="teams" action="edit">
                        <DashboardTeamsForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="jugadores"
                    element={
                      <RequireDashboardPermission
                        resource="players"
                        action="view"
                      >
                        <DashboardPlayersList />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="jugadores/nuevo"
                    element={
                      <RequireDashboardPermission
                        resource="players"
                        action="create"
                      >
                        <DashboardPlayersForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="jugadores/staff/nuevo"
                    element={
                      <RequireDashboardPermission
                        resource="staff"
                        action="create"
                      >
                        <DashboardStaffForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="jugadores/staff/:id"
                    element={
                      <RequireDashboardPermission resource="staff" action="edit">
                        <DashboardStaffForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="jugadores/:id"
                    element={
                      <RequireDashboardPermission
                        resource="players"
                        action="edit"
                      >
                        <DashboardPlayersForm />
                      </RequireDashboardPermission>
                    }
                  />
                  <Route
                    path="moderacion-comentarios"
                    element={
                      <Navigate to={ROUTES.ADMIN_COMMENT_REPORTS} replace />
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

        {!isStandaloneRoute && <Footer />}
      </GameProvider>
    </InitialDataProvider>
  );
}

export default App;
