import { ROUTES } from "../../shared/routing";

export type AdminSection = {
  id: "home" | "commentReports";
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
    actionLabel:
      currentSection.id === "home" ? "Vista general" : "Cola de reportes",
    breadcrumbs: [
      { label: "Admin", route: ROUTES.ADMIN },
      ...(currentSection.id === "home" ? [] : [{ label: currentSection.label }]),
    ],
    currentSection,
    title: currentSection.id === "home" ? "Panel admin" : currentSection.label,
  };
};
