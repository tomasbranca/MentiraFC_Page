import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getGalleries } from "../../../../data/galleries";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import type { GalleryItem } from "../../../../types/models";
import { useInitialData } from "../../../context/useInitialData";
import { shouldLoadGalleryInitially } from "../../../hooks/loading/loadingState.utils";
import { sortGalleriesByDate } from "../../../utils/gallery.utils";

export const useGalleryData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const hasCachedGalleries = useRef(
    queryClient.getQueryState(queryKeys.galleries.all)?.data !== undefined
  );
  const cachedGalleries = hasCachedGalleries.current
    ? queryClient.getQueryData<GalleryItem[]>(queryKeys.galleries.all)
    : undefined;
  const initialGalleries = cachedGalleries ?? initialData.galleries;
  const needsInitialFetch =
    !hasCachedGalleries.current &&
    shouldLoadGalleryInitially(
      initialData.bootstrapScope,
      initialGalleries.length
    );

  const galleriesQuery = useQuery({
    queryKey: queryKeys.galleries.all,
    queryFn: async () => {
      try {
        return await getGalleries();
      } catch (error) {
        reportError(error, {
          page: "Gallery",
          action: "refresh_galleries",
        });
        throw error;
      }
    },
    enabled: true,
    initialData: needsInitialFetch ? undefined : initialGalleries,
    placeholderData: needsInitialFetch ? initialGalleries : undefined,
    refetchInterval: SANITY_FRESHNESS.semiDynamic.refetchInterval,
    refetchOnMount: true,
    staleTime: SANITY_FRESHNESS.semiDynamic.staleTime,
  });

  const galleries = useMemo(
    () => sortGalleriesByDate(galleriesQuery.data ?? []),
    [galleriesQuery.data]
  );
  const loading = needsInitialFetch && galleriesQuery.isFetching;
  const error = Boolean(
    galleriesQuery.error && typeof galleriesQuery.data === "undefined"
  );

  return {
    galleries,
    loading,
    error,
    refetch: async () => {
      await galleriesQuery.refetch();
    },
  };
};
