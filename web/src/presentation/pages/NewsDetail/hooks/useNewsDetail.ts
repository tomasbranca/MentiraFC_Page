// @ts-nocheck
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getNewsBySlug, getSuggestedNews } from "../../../../data/news";
import { queryKeys } from "../../../../data/queryKeys";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/InitialDataContext";
import { selectSuggestedNews } from "../newsDetail.utils";

export const useNewsDetail = (slug) => {
  const { initialData } = useInitialData();
  const detailFromInitialData =
    initialData.currentNewsDetail?.slug === slug
      ? initialData.currentNewsDetail
      : null;
  const canUseInitialData = Boolean(detailFromInitialData);

  const newsItemQuery = useQuery({
    queryKey: queryKeys.news.bySlug(slug),
    enabled: Boolean(slug) && !canUseInitialData,
    queryFn: async () => {
      try {
        return await getNewsBySlug(slug);
      } catch (error) {
        reportError(error, {
          page: "NewsDetail",
          action: "load_news_detail_item",
          slug,
        });
        throw error;
      }
    },
  });

  const suggestedQuery = useQuery({
    queryKey: queryKeys.news.suggested(slug),
    enabled: Boolean(slug) && !canUseInitialData,
    queryFn: async () => {
      try {
        return await getSuggestedNews(slug);
      } catch (error) {
        reportError(error, {
          page: "NewsDetail",
          action: "load_news_detail_suggested",
          slug,
        });
        throw error;
      }
    },
  });

  const suggestedSource = canUseInitialData
    ? detailFromInitialData.suggestedNews
    : suggestedQuery.data ?? [];

  const suggested = useMemo(() => {
    const selected = selectSuggestedNews(suggestedSource);
    return selected.length >= 3 ? selected : [];
  }, [suggestedSource]);

  const loading =
    !canUseInitialData && (newsItemQuery.isLoading || suggestedQuery.isLoading);
  const error = !canUseInitialData && (newsItemQuery.isError || suggestedQuery.isError);

  return {
    newsItem: canUseInitialData
      ? detailFromInitialData.newsItem
      : newsItemQuery.data ?? null,
    suggested,
    loading,
    error,
    refetch: async () => {
      await Promise.all([newsItemQuery.refetch(), suggestedQuery.refetch()]);
    },
  };
};
