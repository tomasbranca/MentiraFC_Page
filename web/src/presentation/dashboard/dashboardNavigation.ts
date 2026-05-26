import { ROUTES } from "../../shared/routing";
import { DASHBOARD_SECTIONS } from "./dashboardSections";

type DashboardSectionResource = (typeof DASHBOARD_SECTIONS)[number]["resource"];

type DashboardRouteActionLabels = {
  edit: string;
  new: string;
};

export type DashboardBreadcrumbItem = {
  label: string;
  route?: string;
};

export type DashboardNavigationContext = {
  actionLabel: string;
  breadcrumbs: DashboardBreadcrumbItem[];
  currentSection: (typeof DASHBOARD_SECTIONS)[number] | null;
  isFormRoute: boolean;
  listRoute: string | null;
  title: string;
};

const DASHBOARD_ROUTE_ACTION_LABELS = {
  news: {
    edit: "Editar noticia",
    new: "Nueva noticia",
  },
  matches: {
    edit: "Editar partido",
    new: "Nuevo partido",
  },
  galleries: {
    edit: "Editar galeria",
    new: "Nueva galeria",
  },
  players: {
    edit: "Editar jugador",
    new: "Nuevo jugador",
  },
  organizations: {
    edit: "Editar organizador",
    new: "Nuevo organizador",
  },
  teams: {
    edit: "Editar club",
    new: "Nuevo club",
  },
  tournaments: {
    edit: "Editar torneo",
    new: "Nuevo torneo",
  },
  table: {
    edit: "Editar tabla",
    new: "Nueva tabla",
  },
} as const satisfies Record<DashboardSectionResource, DashboardRouteActionLabels>;

const normalizeDashboardPathname = (pathname: string): string => {
  const cleanPathname = pathname.split(/[?#]/)[0] || ROUTES.DASHBOARD;

  if (cleanPathname === ROUTES.DASHBOARD) {
    return cleanPathname;
  }

  return cleanPathname.replace(/\/+$/, "");
};

const getSectionSubpath = (
  pathname: string,
  sectionRoute: string
): string => pathname.slice(sectionRoute.length).replace(/^\/+/, "");

const getRouteActionLabel = (
  resource: DashboardSectionResource,
  subpath: string
): string => {
  if (!subpath) {
    return "Listado";
  }

  if (resource === "players" && subpath === "staff/nuevo") {
    return "Nuevo integrante";
  }

  if (resource === "players" && subpath.startsWith("staff/")) {
    return "Editar integrante";
  }

  if (subpath === "nuevo" || subpath === "nueva") {
    return DASHBOARD_ROUTE_ACTION_LABELS[resource].new;
  }

  return DASHBOARD_ROUTE_ACTION_LABELS[resource].edit;
};

export const getDashboardNavigationContext = (
  pathname: string
): DashboardNavigationContext => {
  const normalizedPathname = normalizeDashboardPathname(pathname);

  const currentSection =
    DASHBOARD_SECTIONS.find(
      (section) =>
        normalizedPathname === section.route ||
        normalizedPathname.startsWith(`${section.route}/`)
    ) ?? null;

  if (!currentSection) {
    return {
      actionLabel: "Inicio",
      breadcrumbs: [{ label: "Dashboard" }],
      currentSection: null,
      isFormRoute: false,
      listRoute: null,
      title: "Dashboard",
    };
  }

  const subpath = getSectionSubpath(normalizedPathname, currentSection.route);
  const actionLabel = getRouteActionLabel(currentSection.resource, subpath);
  const isFormRoute = Boolean(subpath);

  return {
    actionLabel,
    breadcrumbs: [
      { label: "Dashboard", route: ROUTES.DASHBOARD },
      { label: currentSection.label, route: currentSection.route },
      ...(isFormRoute ? [{ label: actionLabel }] : []),
    ],
    currentSection,
    isFormRoute,
    listRoute: currentSection.route,
    title: currentSection.label,
  };
};
