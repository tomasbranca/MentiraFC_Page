import {
  GALLERIES_QUERY,
  GALLERY_BY_SLUG_QUERY,
  GALLERIES_PAGE_SORT_BY,
  getGalleriesPageQuery,
  type GalleriesPageSortBy,
} from "../queries/galleries.queries";

import {
  adaptGalleries,
  adaptGalleryListItems,
  adaptSingleGallery,
} from "../adapters/galleries.adapter";
import {
  buildSanityPageParams,
  buildSanityPaginatedResult,
  parseSanityPageOptions,
  type SanityPageOptions,
  type SanityPageQueryResult,
} from "../pagination";
import { normalizeSanitySlugParam } from "../requestParams";
import { fetchSanityQuery } from "../sanityFetch";
import type { GalleryItem, GalleryListItem } from "../../../types/models";
import type { PaginatedResult } from "../../../../shared/pagination";

export type { GalleriesPageSortBy };

export const getGalleries = async (): Promise<GalleryItem[]> => {
  const data = await fetchSanityQuery(GALLERIES_QUERY);
  return adaptGalleries(data);
};

export const getGalleriesPage = async (
  options?: SanityPageOptions<GalleriesPageSortBy>
): Promise<PaginatedResult<GalleryListItem>> => {
  const pagination = parseSanityPageOptions(options, {
    allowedSortBy: GALLERIES_PAGE_SORT_BY,
    defaultSortBy: "date",
  });
  const data = await fetchSanityQuery<SanityPageQueryResult>(
    getGalleriesPageQuery(pagination.sortBy, pagination.direction),
    {
      params: buildSanityPageParams(pagination),
    }
  );

  return buildSanityPaginatedResult(
    adaptGalleryListItems(data.items ?? []),
    data.total,
    pagination
  );
};

export const getGalleryBySlug = async (
  slug: string
): Promise<GalleryItem | null> => {
  const normalizedSlug = normalizeSanitySlugParam(slug);

  if (!normalizedSlug) {
    return null;
  }

  const data = await fetchSanityQuery(GALLERY_BY_SLUG_QUERY, {
    params: { slug: normalizedSlug },
  });
  return adaptSingleGallery(data);
};
