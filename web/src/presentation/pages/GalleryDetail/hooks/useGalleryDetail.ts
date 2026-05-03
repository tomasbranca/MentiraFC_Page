import { useQuery } from "@tanstack/react-query";

import { getGalleryBySlug } from "../../../../data/galleries";
import { queryKeys } from "../../../../data/queryKeys";
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
    enabled: Boolean(slug) && !canUseInitialData,
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
  });

  return {
    gallery: canUseInitialData
      ? galleryFromInitialData.gallery
      : galleryQuery.data ?? null,
    loading: !canUseInitialData && galleryQuery.isLoading,
    error: !canUseInitialData && galleryQuery.isError,
    refetch: async () => {
      await galleryQuery.refetch();
    },
  };
};
