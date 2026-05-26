import {
  hasDashboardResourcePermission,
  type DashboardPermissionResource,
} from "../../domain/auth/permissions";
import type { AppRole } from "../../types/auth";
import { ROUTES } from "../../shared/routing";

export type DashboardSection = {
  resource: DashboardPermissionResource;
  label: string;
  route: string;
};

export const DASHBOARD_SECTIONS = [
  {
    resource: "news",
    label: "Noticias",
    route: ROUTES.DASHBOARD_NEWS,
  },
  {
    resource: "matches",
    label: "Partidos",
    route: ROUTES.DASHBOARD_MATCHES,
  },
  {
    resource: "galleries",
    label: "Galerias",
    route: ROUTES.DASHBOARD_GALLERIES,
  },
  {
    resource: "players",
    label: "Plantel",
    route: ROUTES.DASHBOARD_PLAYERS,
  },
  {
    resource: "organizations",
    label: "Organizadores",
    route: ROUTES.DASHBOARD_ORGANIZATIONS,
  },
  {
    resource: "teams",
    label: "Clubes",
    route: ROUTES.DASHBOARD_TEAMS,
  },
  {
    resource: "tournaments",
    label: "Torneos",
    route: ROUTES.DASHBOARD_TOURNAMENTS,
  },
  {
    resource: "table",
    label: "Tabla",
    route: ROUTES.DASHBOARD_TABLE,
  },
] as const satisfies readonly DashboardSection[];

export const getAllowedDashboardSections = (
  role: AppRole | null | undefined
): DashboardSection[] =>
  DASHBOARD_SECTIONS.filter((section) =>
    hasDashboardResourcePermission(role, section.resource, "view")
  );

export const getFirstAllowedDashboardRoute = (
  role: AppRole | null | undefined
): string | null => getAllowedDashboardSections(role)[0]?.route ?? null;
