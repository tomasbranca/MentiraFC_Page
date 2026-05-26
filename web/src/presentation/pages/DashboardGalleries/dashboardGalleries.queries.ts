import { type QueryClient, queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardGalleries,
  fetchDashboardGalleryById,
  fetchDashboardGalleryOptions,
} from "../../../data/dashboardGalleries";
import { queryKeys } from "../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../data/sanity/freshness";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardGalleryItem } from "../../../types/dashboard";

export const dashboardGalleriesListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.galleries.all,
    queryFn: async () => {
      try {
        return await fetchDashboardGalleries();
      } catch (error) {
        reportError(error, {
          page: "DashboardGalleriesList",
          action: "load_galleries",
        });
        throw error;
      }
    },
    ...SANITY_FRESHNESS.dashboard,
  });

export const dashboardGalleryOptionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.galleries.options,
    queryFn: async () => {
      try {
        return await fetchDashboardGalleryOptions();
      } catch (error) {
        reportError(error, {
          page: "DashboardGalleriesForm",
          action: "load_gallery_options",
        });
        throw error;
      }
    },
    ...SANITY_FRESHNESS.dashboard,
  });

export const dashboardGalleryDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.galleries.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardGalleryById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardGalleriesForm",
          action: "load_gallery",
          id,
        });
        throw error;
      }
    },
    ...SANITY_FRESHNESS.dashboard,
  });

export const invalidateDashboardGalleriesList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.galleries.all,
  });
};

export const invalidateDashboardGalleryPublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardGalleriesList(queryClient),
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.galleries.options,
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.galleries.all }),
  ]);
};

export const cacheDashboardGallery = (
  queryClient: QueryClient,
  gallery: DashboardGalleryItem
) => {
  queryClient.setQueryData(
    queryKeys.dashboard.galleries.byId(gallery.id),
    gallery
  );
};
