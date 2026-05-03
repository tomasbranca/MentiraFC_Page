import { client } from "../sanity.client";
import {
  GALLERIES_QUERY,
  GALLERY_BY_SLUG_QUERY,
} from "../queries/galleries.queries";

import {
  adaptGalleries,
  adaptSingleGallery,
} from "../adapters/galleries.adapter";
import type { GalleryItem } from "../../../types/models";

export const getGalleries = async (): Promise<GalleryItem[]> => {
  const data = await client.fetch(GALLERIES_QUERY);
  return adaptGalleries(data);
};

export const getGalleryBySlug = async (
  slug: string
): Promise<GalleryItem | null> => {
  const data = await client.fetch(GALLERY_BY_SLUG_QUERY, { slug });
  return adaptSingleGallery(data);
};
