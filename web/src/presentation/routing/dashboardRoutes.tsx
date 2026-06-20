import { Navigate, Route } from "react-router-dom";

import { PERMISSIONS } from "../../domain/auth/permissions";
import { lazyWithReload } from "../../lib/lazyWithReload";
import { ROUTES } from "../../shared/routing";
import RequireDashboardPermission from "./RequireDashboardPermission";
import RequirePermission from "./RequirePermission";

const DashboardLayout = lazyWithReload(
  () => import("../layout/DashboardLayout/DashboardLayout")
);
const DashboardHome = lazyWithReload(
  () => import("../pages/Dashboard/DashboardHome")
);
const DashboardNewsList = lazyWithReload(
  () => import("../pages/DashboardNews/DashboardNewsList")
);
const DashboardNewsForm = lazyWithReload(
  () => import("../pages/DashboardNews/DashboardNewsForm")
);
const DashboardMatchesList = lazyWithReload(
  () => import("../pages/DashboardMatches/DashboardMatchesList")
);
const DashboardMatchesForm = lazyWithReload(
  () => import("../pages/DashboardMatches/DashboardMatchesForm")
);
const DashboardGalleriesList = lazyWithReload(
  () => import("../pages/DashboardGalleries/DashboardGalleriesList")
);
const DashboardGalleriesForm = lazyWithReload(
  () => import("../pages/DashboardGalleries/DashboardGalleriesForm")
);
const DashboardTableList = lazyWithReload(
  () => import("../pages/DashboardTable/DashboardTableList")
);
const DashboardTableForm = lazyWithReload(
  () => import("../pages/DashboardTable/DashboardTableForm")
);
const DashboardTournamentsList = lazyWithReload(
  () => import("../pages/DashboardTournaments/DashboardTournamentsList")
);
const DashboardTournamentsForm = lazyWithReload(
  () => import("../pages/DashboardTournaments/DashboardTournamentsForm")
);
const DashboardOrganizationsList = lazyWithReload(
  () => import("../pages/DashboardOrganizations/DashboardOrganizationsList")
);
const DashboardOrganizationsForm = lazyWithReload(
  () => import("../pages/DashboardOrganizations/DashboardOrganizationsForm")
);
const DashboardTeamsList = lazyWithReload(
  () => import("../pages/DashboardTeams/DashboardTeamsList")
);
const DashboardTeamsForm = lazyWithReload(
  () => import("../pages/DashboardTeams/DashboardTeamsForm")
);
const DashboardPlayersList = lazyWithReload(
  () => import("../pages/DashboardPlayers/DashboardPlayersList")
);
const DashboardPlayersForm = lazyWithReload(
  () => import("../pages/DashboardPlayers/DashboardPlayersForm")
);
const DashboardStaffForm = lazyWithReload(
  () => import("../pages/DashboardPlayers/DashboardStaffForm")
);

export const dashboardRoutes = (
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
        <RequireDashboardPermission resource="news" action="create">
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
        <RequireDashboardPermission resource="matches" action="view">
          <DashboardMatchesList />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="partidos/nuevo"
      element={
        <RequireDashboardPermission resource="matches" action="create">
          <DashboardMatchesForm />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="partidos/:id"
      element={
        <RequireDashboardPermission resource="matches" action="edit">
          <DashboardMatchesForm />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="galerias"
      element={
        <RequireDashboardPermission resource="galleries" action="view">
          <DashboardGalleriesList />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="galerias/nueva"
      element={
        <RequireDashboardPermission resource="galleries" action="create">
          <DashboardGalleriesForm />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="galerias/:id"
      element={
        <RequireDashboardPermission resource="galleries" action="edit">
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
        <RequireDashboardPermission resource="table" action="create">
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
        <RequireDashboardPermission resource="tournaments" action="view">
          <DashboardTournamentsList />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="torneos/nuevo"
      element={
        <RequireDashboardPermission resource="tournaments" action="create">
          <DashboardTournamentsForm />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="torneos/:id"
      element={
        <RequireDashboardPermission resource="tournaments" action="edit">
          <DashboardTournamentsForm />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="organizadores"
      element={
        <RequireDashboardPermission resource="organizations" action="view">
          <DashboardOrganizationsList />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="organizadores/nuevo"
      element={
        <RequireDashboardPermission resource="organizations" action="create">
          <DashboardOrganizationsForm />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="organizadores/:id"
      element={
        <RequireDashboardPermission resource="organizations" action="edit">
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
        <RequireDashboardPermission resource="teams" action="create">
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
        <RequireDashboardPermission resource="players" action="view">
          <DashboardPlayersList />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="jugadores/nuevo"
      element={
        <RequireDashboardPermission resource="players" action="create">
          <DashboardPlayersForm />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="jugadores/staff/nuevo"
      element={
        <RequireDashboardPermission resource="staff" action="create">
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
        <RequireDashboardPermission resource="players" action="edit">
          <DashboardPlayersForm />
        </RequireDashboardPermission>
      }
    />
    <Route
      path="moderacion-comentarios"
      element={<Navigate to={ROUTES.ADMIN_COMMENT_REPORTS} replace />}
    />
  </Route>
);
