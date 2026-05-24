import {
  DASHBOARD_RESOURCE_PERMISSIONS,
  hasPermission,
  type DashboardPermissionResource,
} from "../../domain/auth/permissions";
import type { AppRole } from "../../types/auth";
import { ROUTES } from "../../shared/routing";

export type DashboardSection = {
  resource: DashboardPermissionResource;
  label: string;
  route: string;
  permission: (typeof DASHBOARD_RESOURCE_PERMISSIONS)[DashboardPermissionResource]["view"];
};

export const DASHBOARD_SECTIONS = [
  {
    resource: "news",
    label: "Noticias",
    route: ROUTES.DASHBOARD_NEWS,
    permission: DASHBOARD_RESOURCE_PERMISSIONS.news.view,
  },
  {
    resource: "matches",
    label: "Partidos",
    route: ROUTES.DASHBOARD_MATCHES,
    permission: DASHBOARD_RESOURCE_PERMISSIONS.matches.view,
  },
  {
    resource: "players",
    label: "Plantel",
    route: ROUTES.DASHBOARD_PLAYERS,
    permission: DASHBOARD_RESOURCE_PERMISSIONS.players.view,
  },
  {
    resource: "organizations",
    label: "Organizadores",
    route: ROUTES.DASHBOARD_ORGANIZATIONS,
    permission: DASHBOARD_RESOURCE_PERMISSIONS.organizations.view,
  },
  {
    resource: "teams",
    label: "Clubes",
    route: ROUTES.DASHBOARD_TEAMS,
    permission: DASHBOARD_RESOURCE_PERMISSIONS.teams.view,
  },
  {
    resource: "tournaments",
    label: "Torneos",
    route: ROUTES.DASHBOARD_TOURNAMENTS,
    permission: DASHBOARD_RESOURCE_PERMISSIONS.tournaments.view,
  },
  {
    resource: "table",
    label: "Tabla",
    route: ROUTES.DASHBOARD_TABLE,
    permission: DASHBOARD_RESOURCE_PERMISSIONS.table.view,
  },
] as const satisfies readonly DashboardSection[];

export const getAllowedDashboardSections = (
  role: AppRole | null | undefined
): DashboardSection[] =>
  DASHBOARD_SECTIONS.filter((section) =>
    hasPermission(role, section.permission)
  );

export const getFirstAllowedDashboardRoute = (
  role: AppRole | null | undefined
): string | null => getAllowedDashboardSections(role)[0]?.route ?? null;
