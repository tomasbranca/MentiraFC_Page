import { useQuery } from "@tanstack/react-query";

import { getGalleryBySlug } from "../../../../data/galleries";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/useInitialData";

export const useGalleryDetail = (slug: string | undefined) => {
  const { initialData } = useInitialData();
  const galleryFromInitialData =
    slug && initialData.currentGalleryDetail?.slug === slug
      ? initialData.currentGalleryDetail
      : null;
  const canUseInitialData = galleryFromInitialData !== null;

  const galleryQuery = useQuery({
    queryKey: queryKeys.galleries.bySlug(slug ?? ""),
    enabled: Boolean(slug),
    initialData: canUseInitialData
      ? galleryFromInitialData.gallery
      : undefined,
    placeholderData: canUseInitialData
      ? galleryFromInitialData.gallery
      : undefined,
    queryFn: async () => {
      try {
        return await getGalleryBySlug(slug ?? "");
      } catch (error) {
        reportError(error, {
          page: "GalleryDetail",
          action: "load_gallery_detail",
          slug,
        });
        throw error;
      }
    },
    refetchInterval: SANITY_FRESHNESS.semiDynamic.refetchInterval,
    refetchOnMount: true,
    staleTime: SANITY_FRESHNESS.semiDynamic.staleTime,
  });

  return {
    gallery: galleryQuery.data ?? null,
    loading:
      galleryQuery.isLoading && typeof galleryQuery.data === "undefined",
    error: galleryQuery.isError && typeof galleryQuery.data === "undefined",
    refetch: async () => {
      await galleryQuery.refetch();
    },
  };
};
