import {
  DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_GALLERY_IMAGE_MAX_BYTES,
  DASHBOARD_GALLERY_IMAGE_MAX_MEGAPIXELS,
  type DashboardGalleryGameOption,
  type DashboardGalleryInput,
  type DashboardGalleryPhotoInput,
} from "../../../types/dashboard";
import { formatDateTime } from "../../utils/date.utils";

export type DashboardGalleryErrors = Partial<
  Record<"gameId" | "slug" | "photos", string>
>;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizeSlugPart = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const createDashboardGalleryPhotoKey = (): string =>
  `photo-${crypto.randomUUID()}`;

export const createDashboardGalleryUploadKey = (): string =>
  `upload-${crypto.randomUUID()}`;

export const buildDashboardGalleryGameLabel = (
  game?: DashboardGalleryGameOption | null
): string => {
  if (!game) {
    return "Partido sin rival";
  }

  const dateLabel = formatDateTime(game.date ?? "");
  const score =
    game.goalsFor != null && game.goalsAgainst != null
      ? `${game.goalsFor}-${game.goalsAgainst}`
      : "VS";
  const tournamentLabel = [
    game.tournamentOrganizationName,
    game.tournamentName,
  ]
    .filter(Boolean)
    .join(" - ");
  const context = tournamentLabel || game.competition || "Partido";

  return [dateLabel, context, `Mentira FC ${score} ${game.rivalName || "Rival"}`]
    .filter(Boolean)
    .join(" - ");
};

export const buildDashboardGallerySlugFromGame = (
  game?: DashboardGalleryGameOption | null
): string => {
  if (!game) {
    return "";
  }

  const date = game.date ? new Date(game.date) : null;
  const datePart =
    date && !Number.isNaN(date.getTime())
      ? date.toISOString().slice(0, 10)
      : "partido";
  const rivalPart = normalizeSlugPart(game.rivalName || "rival");

  return normalizeSlugPart(`galeria-${datePart}-${rivalPart}`);
};

export const getDashboardGalleryTitle = (
  item: Pick<
    DashboardGalleryGameOption,
    | "date"
    | "competition"
    | "tournamentName"
    | "tournamentOrganizationName"
    | "rivalName"
    | "goalsFor"
    | "goalsAgainst"
  >
): string => buildDashboardGalleryGameLabel({ ...item, id: item.rivalName ?? "" });

export const validateDashboardGalleryInput = (
  values: DashboardGalleryInput
): DashboardGalleryErrors => {
  const errors: DashboardGalleryErrors = {};

  if (!values.gameId.trim()) {
    errors.gameId = "Elegi el partido finalizado de la galeria.";
  }

  if (!values.slug.trim()) {
    errors.slug = "Escribi el slug publico de la galeria.";
  } else if (!slugPattern.test(values.slug.trim())) {
    errors.slug = "Usa minusculas, numeros y guiones, sin espacios.";
  }

  const photosWithImage = values.photos.filter(
    (photo) => photo.imageAssetId || photo.file
  );
  const heroCount = photosWithImage.filter((photo) => photo.isHero).length;

  if (photosWithImage.length === 0) {
    errors.photos = "Carga al menos una foto.";
  } else if (photosWithImage.some((photo) => !photo.alt.trim())) {
    errors.photos = "Cada foto publicada necesita texto alternativo.";
  } else if (heroCount !== 1) {
    errors.photos = "Marca exactamente una foto como hero.";
  }

  return errors;
};

export const validateDashboardGalleryImageFile = (
  file?: Pick<File, "size" | "type"> | null
): string | null => {
  if (!file) {
    return null;
  }

  if (
    !DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES.includes(
      file.type as (typeof DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "La foto debe ser JPG, PNG o WebP.";
  }

  if (file.size > DASHBOARD_GALLERY_IMAGE_MAX_BYTES) {
    return "La foto no puede superar 4 MB en produccion.";
  }

  return null;
};

export const validateDashboardGalleryImageDimensions = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): string | null => {
  const megapixels = (width * height) / 1_000_000;

  if (megapixels > DASHBOARD_GALLERY_IMAGE_MAX_MEGAPIXELS) {
    return "La foto supera el limite de 256 megapixeles de Sanity.";
  }

  return null;
};

export const readDashboardGalleryImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(previewUrl);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error("Invalid image file."));
    };
    image.src = previewUrl;
  });

export const createPhotoInputFromFile = (
  file: File,
  index: number
): DashboardGalleryPhotoInput => ({
  key: createDashboardGalleryPhotoKey(),
  imageAssetId: "",
  imageUrl: "",
  uploadKey: createDashboardGalleryUploadKey(),
  alt: `Foto ${index + 1} de Mentira FC`,
  caption: "",
  isHero: index === 0,
  file,
});
