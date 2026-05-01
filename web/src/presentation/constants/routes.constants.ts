export const ROUTES = {
  HOME: "/",
  NEWS: "/noticias",
  TEAM: "/plantel",
  TABLE: "/tabla",
  RECORD: "/historial",
  ADMIN: "/admin",

  NEWS_DETAIL: (slug: string) => `/noticias/${slug}`,
  PLAYER_DETAIL: (slug: string) => `/plantel/${slug}`,
};
