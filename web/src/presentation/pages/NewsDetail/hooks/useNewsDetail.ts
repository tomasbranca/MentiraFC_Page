import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getNewsBySlug, getSuggestedNews } from "../../../../data/news";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/useInitialData";
import { selectSuggestedNews } from "../newsDetail.utils";

export const useNewsDetail = (slug: string | undefined) => {
  const { initialData } = useInitialData();
  const detailFromInitialData =
    slug && initialData.currentNewsDetail?.slug === slug
      ? initialData.currentNewsDetail
      : null;
  const canUseInitialData = detailFromInitialData !== null;

  const newsItemQuery = useQuery({
    queryKey: queryKeys.news.bySlug(slug ?? ""),
    enabled: Boolean(slug),
    initialData: canUseInitialData ? detailFromInitialData.newsItem : undefined,
    placeholderData: canUseInitialData
      ? detailFromInitialData.newsItem
      : undefined,
    queryFn: async () => {
      try {
        return await getNewsBySlug(slug ?? "");
      } catch (error) {
        reportError(error, {
          page: "NewsDetail",
          action: "load_news_detail_item",
          slug,
        });
        throw error;
      }
    },
    refetchInterval: SANITY_FRESHNESS.news.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.news.staleTime,
  });

  const suggestedQuery = useQuery({
    queryKey: queryKeys.news.suggested(slug ?? ""),
    enabled: Boolean(slug),
    initialData: canUseInitialData
      ? detailFromInitialData.suggestedNews
      : undefined,
    placeholderData: canUseInitialData
      ? detailFromInitialData.suggestedNews
      : undefined,
    queryFn: async () => {
      try {
        return await getSuggestedNews(slug ?? "");
      } catch (error) {
        reportError(error, {
          page: "NewsDetail",
          action: "load_news_detail_suggested",
          slug,
        });
        throw error;
      }
    },
    refetchOnMount: true,
    staleTime: SANITY_FRESHNESS.static.staleTime,
  });

  const suggested = useMemo(() => {
    const suggestedSource = suggestedQuery.data ?? [];
    const selected = selectSuggestedNews(suggestedSource);
    return selected.length >= 3 ? selected : [];
  }, [suggestedQuery.data]);

  const loading =
    newsItemQuery.isLoading && typeof newsItemQuery.data === "undefined";
  const error =
    newsItemQuery.isError && typeof newsItemQuery.data === "undefined";

  return {
    newsItem: newsItemQuery.data ?? null,
    suggested,
    loading,
    error,
    refetch: async () => {
      await Promise.all([newsItemQuery.refetch(), suggestedQuery.refetch()]);
    },
  };
};
