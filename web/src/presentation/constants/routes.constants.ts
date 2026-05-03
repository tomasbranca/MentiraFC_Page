export const ROUTES = {
  HOME: "/",
  NEWS: "/noticias",
  GALLERY: "/galeria",
  TEAM: "/plantel",
  TABLE: "/tabla",
  RECORD: "/historial",
  ADMIN: "/admin",

  NEWS_DETAIL: (slug: string) => `/noticias/${slug}`,
  GALLERY_DETAIL: (slug: string) => `/galeria/${slug}`,
  PLAYER_DETAIL: (slug: string) => `/plantel/${slug}`,
  STAFF_DETAIL: (slug: string) => `/plantel/staff/${slug}`,
};
