export const ROUTES = {
  HOME: "/",
  NEWS: "/noticias",
  TEAM: "/plantel",
  TABLE: "/tabla",
  RECORD: "/historial",

  NEWS_DETAIL: (slug) => `/noticias/${slug}`,
  PLAYER_DETAIL: (slug) => `/plantel/${slug}`,
};