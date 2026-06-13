import { createRoutesFromElements, matchRoutes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ROUTES } from "../../shared/routing";
import { appRouteElements } from "./appRouteElements";
import {
  isStandaloneRoutePath,
  normalizeRoutePathname,
} from "./standaloneRoutes";

const routes = createRoutesFromElements(appRouteElements);

const existingRoutePaths = [
  ROUTES.HOME,
  ROUTES.NEWS,
  ROUTES.GALLERY,
  ROUTES.TEAM,
  ROUTES.TABLE,
  ROUTES.RECORD,
  ROUTES.LOGIN,
  ROUTES.PASSWORD_RESET_REQUEST,
  ROUTES.PASSWORD_RESET_UPDATE,
  ROUTES.ACCOUNT,
  ROUTES.ADMIN,
  ROUTES.ADMIN_COMMENT_REPORTS,
  ROUTES.ADMIN_USERS,
  ROUTES.ADMIN_ROLES,
  ROUTES.ADMIN_FOOTER_SETTINGS,
  ROUTES.ADMIN_AUDIT_LOG,
  ROUTES.ADMIN_METRICS,
  ROUTES.ADMIN_AUTH_CONTROLS,
  ROUTES.ADMIN_FEATURE_FLAGS,
  ROUTES.ADMIN_MAINTENANCE,
  ROUTES.DASHBOARD,
  ROUTES.DASHBOARD_NEWS,
  ROUTES.DASHBOARD_NEWS_NEW,
  ROUTES.DASHBOARD_NEWS_EDIT("news-1"),
  ROUTES.DASHBOARD_MATCHES,
  ROUTES.DASHBOARD_MATCHES_NEW,
  ROUTES.DASHBOARD_MATCHES_EDIT("match-1"),
  ROUTES.DASHBOARD_GALLERIES,
  ROUTES.DASHBOARD_GALLERIES_NEW,
  ROUTES.DASHBOARD_GALLERIES_EDIT("gallery-1"),
  ROUTES.DASHBOARD_TABLE,
  ROUTES.DASHBOARD_TABLE_NEW,
  ROUTES.DASHBOARD_TABLE_EDIT("table-1"),
  ROUTES.DASHBOARD_TOURNAMENTS,
  ROUTES.DASHBOARD_TOURNAMENTS_NEW,
  ROUTES.DASHBOARD_TOURNAMENTS_EDIT("tournament-1"),
  ROUTES.DASHBOARD_ORGANIZATIONS,
  ROUTES.DASHBOARD_ORGANIZATIONS_NEW,
  ROUTES.DASHBOARD_ORGANIZATIONS_EDIT("organization-1"),
  ROUTES.DASHBOARD_TEAMS,
  ROUTES.DASHBOARD_TEAMS_NEW,
  ROUTES.DASHBOARD_TEAMS_EDIT("team-1"),
  ROUTES.DASHBOARD_PLAYERS,
  ROUTES.DASHBOARD_PLAYERS_NEW,
  ROUTES.DASHBOARD_PLAYERS_EDIT("player-1"),
  ROUTES.DASHBOARD_STAFF_NEW,
  ROUTES.DASHBOARD_STAFF_EDIT("staff-1"),
  ROUTES.DASHBOARD_COMMENTS_MODERATION,
  ROUTES.NEWS_DETAIL("noticia-1"),
  ROUTES.GALLERY_DETAIL("galeria-1"),
  ROUTES.STAFF_DETAIL("staff-1"),
  ROUTES.PLAYER_DETAIL("jugador-1"),
];

describe("AppRoutes", () => {
  it.each(existingRoutePaths)("resuelve la ruta %s", (routePath) => {
    expect(matchRoutes(routes, routePath)).not.toBeNull();
  });
});

describe("standaloneRoutes", () => {
  it("normaliza barras finales igual que App", () => {
    expect(normalizeRoutePathname("/admin/")).toBe(ROUTES.ADMIN);
    expect(normalizeRoutePathname("/dashboard/noticias/")).toBe(
      ROUTES.DASHBOARD_NEWS
    );
  });

  it("mantiene standalone solo para auth y admin", () => {
    expect(isStandaloneRoutePath(ROUTES.LOGIN)).toBe(true);
    expect(isStandaloneRoutePath(ROUTES.PASSWORD_RESET_REQUEST)).toBe(true);
    expect(isStandaloneRoutePath(ROUTES.PASSWORD_RESET_UPDATE)).toBe(true);
    expect(isStandaloneRoutePath(ROUTES.ADMIN)).toBe(true);
    expect(isStandaloneRoutePath(ROUTES.ADMIN_USERS)).toBe(true);
    expect(isStandaloneRoutePath(ROUTES.DASHBOARD)).toBe(false);
    expect(isStandaloneRoutePath(ROUTES.HOME)).toBe(false);
  });
});
