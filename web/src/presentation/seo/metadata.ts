import { getImageUrl } from "../../data/imageService";
import type {
  GalleryItem,
  NewsItem,
  Player,
  StaffMember,
} from "../../types/models";
import { ROUTES } from "../../shared/routing";
import { buildGalleryMatchTitle } from "../utils/gallery.utils";
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
  gallery: {
    ...DEFAULT_HEAD,
    title: withSiteName("Galerias"),
    description:
      "Galerias de fotos de los partidos finalizados de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.GALLERY),
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
  login: {
    ...DEFAULT_HEAD,
    title: withSiteName("Ingresar"),
    description: "Acceso a la cuenta de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.LOGIN),
    robots: "noindex, nofollow",
  },
  passwordResetRequest: {
    ...DEFAULT_HEAD,
    title: withSiteName("Recuperar contraseña"),
    description: "Recuperación de acceso a la cuenta de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.PASSWORD_RESET_REQUEST),
    robots: "noindex, nofollow",
  },
  passwordResetUpdate: {
    ...DEFAULT_HEAD,
    title: withSiteName("Nueva contraseña"),
    description: "Actualización segura de contraseña de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.PASSWORD_RESET_UPDATE),
    robots: "noindex, nofollow",
  },
  account: {
    ...DEFAULT_HEAD,
    title: withSiteName("Mi cuenta"),
    description: "Datos de cuenta de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.ACCOUNT),
    robots: "noindex, nofollow",
  },
  admin: {
    ...DEFAULT_HEAD,
    title: withSiteName("Panel admin"),
    description: "Panel de administracion de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.ADMIN),
    robots: "noindex, nofollow",
  },
  dashboard: {
    ...DEFAULT_HEAD,
    title: withSiteName("Dashboard"),
    description: "Panel interno de gestion de Mentira FC.",
    canonicalUrl: canonicalUrl(ROUTES.DASHBOARD),
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

  if (
    normalizedPathname === ROUTES.ADMIN ||
    normalizedPathname.startsWith(`${ROUTES.ADMIN}/`)
  ) {
    return STATIC_PAGE_HEAD.admin;
  }

  if (
    normalizedPathname === ROUTES.DASHBOARD ||
    normalizedPathname.startsWith(`${ROUTES.DASHBOARD}/`)
  ) {
    return STATIC_PAGE_HEAD.dashboard;
  }

  switch (normalizedPathname) {
    case ROUTES.HOME:
      return STATIC_PAGE_HEAD.home;
    case ROUTES.NEWS:
      return STATIC_PAGE_HEAD.news;
    case ROUTES.GALLERY:
      return STATIC_PAGE_HEAD.gallery;
    case ROUTES.TEAM:
      return STATIC_PAGE_HEAD.team;
    case ROUTES.TABLE:
      return STATIC_PAGE_HEAD.table;
    case ROUTES.RECORD:
      return STATIC_PAGE_HEAD.record;
    case ROUTES.LOGIN:
      return STATIC_PAGE_HEAD.login;
    case ROUTES.PASSWORD_RESET_REQUEST:
      return STATIC_PAGE_HEAD.passwordResetRequest;
    case ROUTES.PASSWORD_RESET_UPDATE:
      return STATIC_PAGE_HEAD.passwordResetUpdate;
    case ROUTES.ACCOUNT:
      return STATIC_PAGE_HEAD.account;
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
    imageAlt: newsItem.imageAlt || newsItem.title,
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

export const buildGalleryHead = (gallery: GalleryItem): HeadMetadata => {
  const title = buildGalleryMatchTitle(gallery.game);
  const description = truncate(
    `${gallery.photoCount} fotos del partido ${title}.`
  );

  return {
    ...DEFAULT_HEAD,
    title: withSiteName(title),
    description,
    canonicalUrl: canonicalUrl(ROUTES.GALLERY_DETAIL(gallery.slug)),
    imageUrl: resolveImageUrl(gallery.heroImage.imageUrl),
    imageAlt: gallery.heroImage.alt || title,
    openGraphType: "article",
    publishedTime: gallery.date,
  };
};

export const buildMissingGalleryHead = (slug?: string): HeadMetadata => ({
  ...STATIC_PAGE_HEAD.gallery,
  title: withSiteName("Galeria no encontrada"),
  canonicalUrl: canonicalUrl(
    slug ? ROUTES.GALLERY_DETAIL(slug) : ROUTES.GALLERY
  ),
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
