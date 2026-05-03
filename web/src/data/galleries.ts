import {
  getGalleries as fetchGalleries,
  getGalleryBySlug as fetchGalleryBySlug,
} from "./sanity/services/galleries.service";

import type { GalleryItem } from "../types/models";

export const getGalleries = async (): Promise<GalleryItem[]> =>
  fetchGalleries();

export const getGalleryBySlug = async (
  slug: string
): Promise<GalleryItem | null> => fetchGalleryBySlug(slug);
