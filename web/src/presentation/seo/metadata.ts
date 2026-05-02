import { getImageUrl } from "../../data/imageService";
import type { NewsItem, Player, StaffMember } from "../../types/models";
import { ROUTES } from "../constants/routes.constants";
import type { HeadMetadata } from "./head";

const SITE_NAME = "Mentira FC";
const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://mentirafc.vercel.app"
).replace(/\/+$/, "");
const DEFAULT_IMAGE_PATH = "/og_image.png";
const DEFAULT_DESCRIPTION =
  "Mentira FC: estadísticas, jugadores y partidos del club amateur en la Liga Castrol.";

const absoluteUrl = (value: string): string => {
  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return `${SITE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
  }
};

const canonicalUrl = (path: string): string => absoluteUrl(path || ROUTES.HOME);

const normalizeText = (value?: string | null): string =>
  (value ?? "").replace(/\s+/g, " ").trim();

const truncate = (value: string, maxLength = 155): string => {
  const text = normalizeText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
};

const withSiteName = (title: string): string =>
  title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

const resolveImageUrl = (image: unknown): string => {
  const imageUrl = getImageUrl(image, {
    width: 1200,
    height: 630,
    fit: "crop",
    quality: 80,
    autoFormat: true,
  });

  return absoluteUrl(imageUrl || DEFAULT_IMAGE_PATH);
};

export const DEFAULT_HEAD: HeadMetadata = {
  title: `${SITE_NAME} | Sitio Oficial`,
  description: DEFAULT_DESCRIPTION,
  canonicalUrl: canonicalUrl(ROUTES.HOME),
  imageUrl: resolveImageUrl(DEFAULT_IMAGE_PATH),
  imageAlt: SITE_NAME,
  openGraphType: "website",
};

export const STATIC_PAGE_HEAD = {
  home: DEFAULT_HEAD,
  news: {
    ...DEFAULT_HEAD,
    title: withSiteName("Noticias"),
    description: "Noticias, novedades y crónicas recientes de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.NEWS),
  },
  team: {
    ...DEFAULT_HEAD,
    title: withSiteName("Plantel"),
    description: "Plantel de Mentira FC con jugadores, posiciones y datos del equipo.",
    canonicalUrl: canonicalUrl(ROUTES.TEAM),
  },
  table: {
    ...DEFAULT_HEAD,
    title: withSiteName("Tabla"),
    description: "Tabla de posiciones y rendimiento de Mentira FC en la Liga Castrol.",
    canonicalUrl: canonicalUrl(ROUTES.TABLE),
  },
  record: {
    ...DEFAULT_HEAD,
    title: withSiteName("Historial"),
    description: "Historial de partidos, resultados y estadísticas de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.RECORD),
  },
  admin: {
    ...DEFAULT_HEAD,
    title: withSiteName("Admin"),
    description: "Panel administrativo de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.ADMIN),
    robots: "noindex, nofollow",
  },
} satisfies Record<string, HeadMetadata>;

const normalizePathname = (pathname: string): string => {
  if (pathname === ROUTES.HOME) {
    return ROUTES.HOME;
  }

  return pathname.replace(/\/+$/, "");
};

export const getStaticPageHeadByPathname = (
  pathname: string
): HeadMetadata | null => {
  const normalizedPathname = normalizePathname(pathname);

  switch (normalizedPathname) {
    case ROUTES.HOME:
      return STATIC_PAGE_HEAD.home;
    case ROUTES.NEWS:
      return STATIC_PAGE_HEAD.news;
    case ROUTES.TEAM:
      return STATIC_PAGE_HEAD.team;
    case ROUTES.TABLE:
      return STATIC_PAGE_HEAD.table;
    case ROUTES.RECORD:
      return STATIC_PAGE_HEAD.record;
    case ROUTES.ADMIN:
      return STATIC_PAGE_HEAD.admin;
    default:
      return null;
  }
};

export const buildNewsHead = (newsItem: NewsItem): HeadMetadata => {
  const description = truncate(newsItem.description || DEFAULT_DESCRIPTION);

  return {
    ...DEFAULT_HEAD,
    title: withSiteName(newsItem.title),
    description,
    canonicalUrl: canonicalUrl(ROUTES.NEWS_DETAIL(newsItem.slug)),
    imageUrl: resolveImageUrl(newsItem.imageUrl),
    imageAlt: newsItem.title,
    openGraphType: "article",
    publishedTime: newsItem.date,
  };
};

export const buildMissingNewsHead = (slug?: string): HeadMetadata => ({
  ...STATIC_PAGE_HEAD.news,
  title: withSiteName("Noticia no encontrada"),
  canonicalUrl: canonicalUrl(slug ? ROUTES.NEWS_DETAIL(slug) : ROUTES.NEWS),
  robots: "noindex, follow",
});

export const buildPlayerHead = (
  player: Player,
  positionLabel?: string | null
): HeadMetadata => {
  const fullName = normalizeText(player.fullName) ||
    normalizeText(`${player.name} ${player.lastName}`);
  const numberText = player.number ? `, camiseta ${player.number}` : "";
  const positionText = positionLabel ? `, ${positionLabel.toLowerCase()}` : "";
  const description = truncate(
    `${fullName}${numberText}${positionText} en el plantel de Mentira FC.`
  );

  return {
    ...DEFAULT_HEAD,
    title: withSiteName(fullName),
    description,
    canonicalUrl: canonicalUrl(
      ROUTES.PLAYER_DETAIL(player.slug ?? player.id)
    ),
    imageUrl: resolveImageUrl(player.imageUrl),
    imageAlt: fullName,
    openGraphType: "profile",
  };
};

export const buildMissingPlayerHead = (slug?: string): HeadMetadata => ({
  ...STATIC_PAGE_HEAD.team,
  title: withSiteName("Jugador no encontrado"),
  canonicalUrl: canonicalUrl(slug ? ROUTES.PLAYER_DETAIL(slug) : ROUTES.TEAM),
  robots: "noindex, follow",
});

export const buildStaffHead = (staffMember: StaffMember): HeadMetadata => {
  const fullName = normalizeText(staffMember.fullName) ||
    normalizeText(`${staffMember.name} ${staffMember.lastName}`);
  const roleText = normalizeText(staffMember.role).toLowerCase();
  const description = truncate(
    `${fullName}${roleText ? `, ${roleText}` : ""} en el staff de Mentira FC.`
  );

  return {
    ...DEFAULT_HEAD,
    title: withSiteName(fullName),
    description,
    canonicalUrl: canonicalUrl(
      ROUTES.STAFF_DETAIL(staffMember.slug ?? staffMember.id)
    ),
    imageUrl: resolveImageUrl(staffMember.imageUrl),
    imageAlt: fullName,
    openGraphType: "profile",
  };
};

export const buildMissingStaffHead = (slug?: string): HeadMetadata => ({
  ...STATIC_PAGE_HEAD.team,
  title: withSiteName("Staff no encontrado"),
  canonicalUrl: canonicalUrl(slug ? ROUTES.STAFF_DETAIL(slug) : ROUTES.TEAM),
  robots: "noindex, follow",
});
