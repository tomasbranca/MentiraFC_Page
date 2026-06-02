import {
  getGalleries as fetchGalleries,
  getGalleriesPage as fetchGalleriesPage,
  getGalleryBySlug as fetchGalleryBySlug,
  type GalleriesPageSortBy,
} from "./sanity/services/galleries.service";

import type { PaginatedResult } from "../../shared/pagination";
import type { SanityPageOptions } from "./sanity/pagination";
import type { GalleryItem, GalleryListItem } from "../types/models";

export const getGalleries = async (): Promise<GalleryItem[]> =>
  fetchGalleries();

export const getGalleriesPage = async (
  options?: SanityPageOptions<GalleriesPageSortBy>
): Promise<PaginatedResult<GalleryListItem>> => fetchGalleriesPage(options);

export const getGalleryBySlug = async (
  slug: string
): Promise<GalleryItem | null> => fetchGalleryBySlug(slug);
