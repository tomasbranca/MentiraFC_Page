import type {
  GalleryImage,
  GalleryItem,
  GalleryListItem,
} from "../../../types/models";
import {
  getSanitySlugValue,
  sanityGalleryImageSchema,
  sanityGallerySchema,
  type SanityGallery,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";
import { adaptGame } from "./games.adapter";

const adaptGalleryImage = (image: unknown): GalleryImage | null => {
  const validated = validateSanityItem(
    sanityGalleryImageSchema,
    image,
    "galleries.adapter:adaptGalleryImage"
  );
  if (!validated?.imageUrl) return null;

  return {
    id: validated._key ?? validated.imageUrl,
    imageUrl: validated.imageUrl,
    alt: validated.alt?.trim() || "Foto de Mentira FC",
    caption: validated.caption,
    isHero: validated.isHero,
    originalFilename: validated.originalFilename,
    dimensions: validated.dimensions,
  };
};

export const adaptSingleGallery = (item: unknown): GalleryItem | null => {
  const validated = validateSanityItem(
    sanityGallerySchema,
    item,
    "galleries.adapter:adaptSingleGallery"
  );
  if (!validated?.game) return null;

  const game = adaptGame(validated.game);
  const slug = getSanitySlugValue(validated.slug);
  const images = (validated.photos ?? [])
    .map(adaptGalleryImage)
    .filter((image): image is GalleryImage => Boolean(image));

  if (!game || !slug || !images.length) {
    return null;
  }

  const heroImage = images.find((image) => image.isHero) ?? images[0];

  return {
    id: validated._id,
    slug,
    date: game.date,
    game,
    heroImage,
    images,
    photoCount: validated.photoCount ?? images.length,
  };
};

export const adaptSingleGalleryListItem = (
  item: unknown
): GalleryListItem | null => {
  const gallery = adaptSingleGallery(item);

  if (!gallery) {
    return null;
  }

  return {
    id: gallery.id,
    slug: gallery.slug,
    date: gallery.date,
    game: gallery.game,
    heroImage: gallery.heroImage,
    photoCount: gallery.photoCount,
  };
};

export const adaptGalleries = (galleries: unknown): GalleryItem[] => {
  const validatedGalleries: SanityGallery[] = validateSanityArray(
    sanityGallerySchema,
    galleries,
    "galleries.adapter:adaptGalleries"
  );

  return validatedGalleries
    .map(adaptSingleGallery)
    .filter((gallery): gallery is GalleryItem => Boolean(gallery));
};

export const adaptGalleryListItems = (galleries: unknown): GalleryListItem[] =>
  adaptGalleries(galleries).map((gallery) => ({
    id: gallery.id,
    slug: gallery.slug,
    date: gallery.date,
    game: gallery.game,
    heroImage: gallery.heroImage,
    photoCount: gallery.photoCount,
  }));
