import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getGalleriesPage } from "../../../../data/galleries";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { sortGalleriesByDate } from "../../../utils/gallery.utils";

const GALLERIES_PAGE_LIMIT = 9;

export const useGalleryData = () => {
  const galleriesQuery = useInfiniteQuery({
    queryKey: queryKeys.galleries.page({
      page: 1,
      limit: GALLERIES_PAGE_LIMIT,
    }),
    queryFn: async ({ pageParam }) => {
      try {
        return await getGalleriesPage({
          page: pageParam,
          limit: GALLERIES_PAGE_LIMIT,
          sortBy: "date",
          direction: "desc",
        });
      } catch (error) {
        reportError(error, {
          page: "Gallery",
          action: "load_galleries_page",
        });
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage && lastPage.page ? lastPage.page + 1 : undefined,
    enabled: true,
    refetchInterval: SANITY_FRESHNESS.semiDynamic.refetchInterval,
    refetchOnMount: true,
    staleTime: SANITY_FRESHNESS.semiDynamic.staleTime,
  });

  const galleries = useMemo(
    () =>
      sortGalleriesByDate(
        galleriesQuery.data?.pages.flatMap((page) => page.items) ?? []
      ),
    [galleriesQuery.data]
  );
  const loading =
    galleriesQuery.isLoading && typeof galleriesQuery.data === "undefined";
  const error = Boolean(
    galleriesQuery.error && typeof galleriesQuery.data === "undefined"
  );

  return {
    galleries,
    loading,
    error,
    hasMore: Boolean(galleriesQuery.hasNextPage),
    loadingMore: galleriesQuery.isFetchingNextPage,
    fetchNextPage: async () => {
      await galleriesQuery.fetchNextPage();
    },
    refetch: async () => {
      await galleriesQuery.refetch();
    },
  };
};
