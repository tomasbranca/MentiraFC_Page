import {
  GALLERIES_QUERY,
  GALLERY_BY_SLUG_QUERY,
} from "../queries/galleries.queries";

import {
  adaptGalleries,
  adaptSingleGallery,
} from "../adapters/galleries.adapter";
import { fetchSanityQuery } from "../sanityFetch";
import type { GalleryItem } from "../../../types/models";

export const getGalleries = async (): Promise<GalleryItem[]> => {
  const data = await fetchSanityQuery(GALLERIES_QUERY);
  return adaptGalleries(data);
};

export const getGalleryBySlug = async (
  slug: string
): Promise<GalleryItem | null> => {
  const data = await fetchSanityQuery(GALLERY_BY_SLUG_QUERY, {
    params: { slug },
  });
  return adaptSingleGallery(data);
};
