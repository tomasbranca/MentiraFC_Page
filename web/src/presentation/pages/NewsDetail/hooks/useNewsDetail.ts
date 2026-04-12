// @ts-nocheck
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getNewsBySlug, getSuggestedNews } from "../../../../data/news";
import { queryKeys } from "../../../../data/queryKeys";
import { reportError } from "../../../../lib/errors/errorLogger";
import { selectSuggestedNews } from "../newsDetail.utils";

export const useNewsDetail = (slug) => {
  const [newsItemQuery, suggestedQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.news.bySlug(slug),
        enabled: Boolean(slug),
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
      },
      {
        queryKey: queryKeys.news.suggested(slug),
        enabled: Boolean(slug),
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
      },
    ],
  });

  const suggested = useMemo(() => {
    const selected = selectSuggestedNews(suggestedQuery.data ?? []);
    return selected.length >= 3 ? selected : [];
  }, [suggestedQuery.data]);

  const loading = newsItemQuery.isLoading || suggestedQuery.isLoading;
  const error = newsItemQuery.isError || suggestedQuery.isError;

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
