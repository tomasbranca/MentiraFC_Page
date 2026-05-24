import { ROUTES } from "../../shared/routing";

const FALLBACK_LOCAL_ORIGIN = "http://localhost:5173";

const normalizeOrigin = (value?: string): string | null => {
  const rawValue = value?.trim();

  if (!rawValue) {
    return null;
  }

  const urlValue = rawValue.startsWith("http") ? rawValue : `https://${rawValue}`;

  try {
    return new URL(urlValue).origin;
  } catch {
    return null;
  }
};

export const getAuthRedirectOrigin = (): string => {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return (
    normalizeOrigin(import.meta.env.VITE_SITE_URL) ??
    normalizeOrigin(import.meta.env.VITE_VERCEL_URL) ??
    FALLBACK_LOCAL_ORIGIN
  );
};

export const buildAuthRedirectUrl = (pathname: string): string =>
  new URL(pathname, `${getAuthRedirectOrigin()}/`).toString();

export const buildPasswordResetRedirectUrl = (): string =>
  buildAuthRedirectUrl(ROUTES.PASSWORD_RESET_UPDATE);
