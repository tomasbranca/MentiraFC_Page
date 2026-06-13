import { ROUTES } from "../../shared/routing";

const AUTH_STANDALONE_ROUTES = new Set([
  ROUTES.LOGIN,
  ROUTES.PASSWORD_RESET_REQUEST,
  ROUTES.PASSWORD_RESET_UPDATE,
]);

export const normalizeRoutePathname = (pathname: string) =>
  pathname === ROUTES.HOME ? pathname : pathname.replace(/\/+$/, "");

export const isAuthStandaloneRoutePath = (pathname: string) =>
  AUTH_STANDALONE_ROUTES.has(normalizeRoutePathname(pathname));

export const isAdminRoutePath = (pathname: string) => {
  const normalizedPathname = normalizeRoutePathname(pathname);

  return (
    normalizedPathname === ROUTES.ADMIN ||
    normalizedPathname.startsWith(`${ROUTES.ADMIN}/`)
  );
};

export const isStandaloneRoutePath = (pathname: string) =>
  isAuthStandaloneRoutePath(pathname) || isAdminRoutePath(pathname);
