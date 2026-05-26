import { useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getNews } from "../../../../data/news";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadNewsInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/useInitialData";
import { sortNews } from "../../../utils/news.utils";
import type { NewsItem } from "../../../../types/models";

export const useNewsData = () => {
  const { initialData } = useInitialData();
  const queryClient = useQueryClient();
  const hasCachedNews = useRef(
    queryClient.getQueryState(queryKeys.news.all)?.data !== undefined
  );
  const cachedNews = hasCachedNews.current
    ? queryClient.getQueryData<NewsItem[]>(queryKeys.news.all)
    : undefined;
  const initialNews = cachedNews ?? initialData.news;
  const needsInitialFetch =
    !hasCachedNews.current &&
    shouldLoadNewsInitially(initialData.bootstrapScope, initialNews.length);

  const newsQuery = useQuery({
    queryKey: queryKeys.news.all,
    queryFn: async () => {
      try {
        return await getNews();
      } catch (error) {
        reportError(error, {
          page: "News",
          action: "refresh_news",
        });
        throw error;
      }
    },
    enabled: true,
    initialData: needsInitialFetch ? undefined : initialNews,
    placeholderData: needsInitialFetch ? initialNews : undefined,
    refetchInterval: SANITY_FRESHNESS.news.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.news.staleTime,
  });

  const news = useMemo(() => sortNews(newsQuery.data ?? []), [newsQuery.data]);
  const loading = needsInitialFetch && newsQuery.isFetching;
  const error = Boolean(
    newsQuery.error && typeof newsQuery.data === "undefined"
  );

  return {
    news,
    loading,
    error,
    refetch: async () => {
      await newsQuery.refetch();
    },
  };
};
