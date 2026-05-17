export const ROUTES = {
  HOME: "/",
  NEWS: "/noticias",
  GALLERY: "/galeria",
  TEAM: "/plantel",
  TABLE: "/tabla",
  RECORD: "/historial",
  LOGIN: "/ingresar",
  ACCOUNT: "/mi-cuenta",
  DASHBOARD: "/dashboard",
  DASHBOARD_NEWS: "/dashboard/noticias",
  DASHBOARD_NEWS_NEW: "/dashboard/noticias/nueva",

  NEWS_DETAIL: (slug: string) => `/noticias/${slug}`,
  GALLERY_DETAIL: (slug: string) => `/galeria/${slug}`,
  PLAYER_DETAIL: (slug: string) => `/plantel/${slug}`,
  STAFF_DETAIL: (slug: string) => `/plantel/staff/${slug}`,
  DASHBOARD_NEWS_EDIT: (id: string) => `/dashboard/noticias/${id}`,
};
