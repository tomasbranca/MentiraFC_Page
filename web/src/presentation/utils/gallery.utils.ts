import type {
  GalleryImage,
  GalleryItem,
  GameListItem,
} from "../../types/models";

const TEAM_NAME = "Mentira FC";
const DEFAULT_DOWNLOAD_EXTENSION = "jpg";

export type GalleryImageLayout =
  | "feature"
  | "landscape"
  | "panorama"
  | "portrait"
  | "portraitFeature"
  | "square";

const normalizeText = (value?: string | null): string =>
  (value ?? "").replace(/\s+/g, " ").trim();

export const getGalleryCompetitionName = (game: GameListItem): string => {
  const tournament = normalizeText(game.tournament);
  const competition = normalizeText(game.competition);

  return tournament || competition || "Partido";
};

export const buildGalleryMatchTitle = (game: GameListItem): string => {
  const competition = getGalleryCompetitionName(game);
  const rival = normalizeText(game.rival?.name) || "Rival";
  const result = game.result
    ? `${TEAM_NAME} ${game.result.goalsFor} - ${rival} ${game.result.goalsAgainst}`
    : `${TEAM_NAME} vs ${rival}`;

  return competition ? `${competition} - ${result}` : result;
};

export const sortGalleriesByDate = <T extends Pick<GalleryItem, "date">>(
  galleries: T[] = []
): T[] =>
  [...galleries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

export const getGalleryImageAspectRatio = (image: GalleryImage): number => {
  const dimensions = image.dimensions;
  const aspectFromMetadata = dimensions?.aspectRatio;

  if (aspectFromMetadata && aspectFromMetadata > 0) {
    return aspectFromMetadata;
  }

  const width = dimensions?.width;
  const height = dimensions?.height;

  if (width && height && width > 0 && height > 0) {
    return width / height;
  }

  return 4 / 3;
};

export const getGalleryImageLayout = (
  image: GalleryImage,
  index: number
): GalleryImageLayout => {
  const aspectRatio = getGalleryImageAspectRatio(image);

  if (index === 0) {
    return aspectRatio < 0.82 ? "portraitFeature" : "feature";
  }

  if (aspectRatio >= 2.1) {
    return "panorama";
  }

  if (aspectRatio >= 1.25) {
    return "landscape";
  }

  if (aspectRatio <= 0.78) {
    return "portrait";
  }

  return "square";
};

const sanitizeFilename = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const getExtensionFromFilename = (filename?: string | null): string => {
  const match = filename?.match(/\.([a-zA-Z0-9]+)$/);

  return match?.[1] || DEFAULT_DOWNLOAD_EXTENSION;
};

export const getGalleryImageDownloadFilename = (
  gallery: GalleryItem,
  image: GalleryImage,
  index: number
): string => {
  if (image.originalFilename) {
    return sanitizeFilename(image.originalFilename);
  }

  const extension = getExtensionFromFilename(image.originalFilename);
  return sanitizeFilename(`${gallery.slug}-${index + 1}.${extension}`);
};

export const getGalleryImageDownloadUrl = (
  gallery: GalleryItem,
  image: GalleryImage,
  index: number
): string => {
  const filename = getGalleryImageDownloadFilename(gallery, image, index);

  try {
    const url = new URL(image.imageUrl);
    url.searchParams.set("dl", filename);

    return url.toString();
  } catch {
    return image.imageUrl;
  }
};
