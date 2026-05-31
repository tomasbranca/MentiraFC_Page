import { ROUTES } from "../../shared/routing";

export type AdminSection = {
  id:
    | "home"
    | "users"
    | "roles"
    | "commentReports"
    | "footerSettings"
    | "auditLog"
    | "metrics"
    | "authControls"
    | "featureFlags"
    | "maintenance";
  label: string;
  route: string;
};

export type AdminBreadcrumbItem = {
  label: string;
  route?: string;
};

export type AdminNavigationContext = {
  actionLabel: string;
  breadcrumbs: AdminBreadcrumbItem[];
  currentSection: AdminSection;
  title: string;
};

export const ADMIN_SECTIONS = [
  {
    id: "home",
    label: "Inicio",
    route: ROUTES.ADMIN,
  },
  {
    id: "commentReports",
    label: "Reportes",
    route: ROUTES.ADMIN_COMMENT_REPORTS,
  },
  {
    id: "users",
    label: "Usuarios",
    route: ROUTES.ADMIN_USERS,
  },
  {
    id: "roles",
    label: "Roles y permisos",
    route: ROUTES.ADMIN_ROLES,
  },
  {
    id: "footerSettings",
    label: "Footer y sponsors",
    route: ROUTES.ADMIN_FOOTER_SETTINGS,
  },
  {
    id: "auditLog",
    label: "Audit log",
    route: ROUTES.ADMIN_AUDIT_LOG,
  },
  {
    id: "metrics",
    label: "Metricas",
    route: ROUTES.ADMIN_METRICS,
  },
  {
    id: "authControls",
    label: "Auth",
    route: ROUTES.ADMIN_AUTH_CONTROLS,
  },
  {
    id: "featureFlags",
    label: "Feature flags",
    route: ROUTES.ADMIN_FEATURE_FLAGS,
  },
  {
    id: "maintenance",
    label: "Mantenimiento",
    route: ROUTES.ADMIN_MAINTENANCE,
  },
] as const satisfies readonly AdminSection[];

const normalizeAdminPathname = (pathname: string): string => {
  const cleanPathname = pathname.split(/[?#]/)[0] || ROUTES.ADMIN;

  if (cleanPathname === ROUTES.ADMIN) {
    return cleanPathname;
  }

  return cleanPathname.replace(/\/+$/, "");
};

export const getAdminNavigationContext = (
  pathname: string
): AdminNavigationContext => {
  const normalizedPathname = normalizeAdminPathname(pathname);
  const currentSection =
    ADMIN_SECTIONS.find((section) => section.route === normalizedPathname) ??
    ADMIN_SECTIONS[0];

  return {
    actionLabel: currentSection.id === "home" ? "Vista general" : currentSection.label,
    breadcrumbs: [
      { label: "Admin", route: ROUTES.ADMIN },
      ...(currentSection.id === "home" ? [] : [{ label: currentSection.label }]),
    ],
    currentSection,
    title: currentSection.id === "home" ? "Panel admin" : currentSection.label,
  };
};
