import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getNewsPage } from "../../../../data/news";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { sortNews } from "../../../utils/news.utils";

const NEWS_PAGE_LIMIT = 9;

export const useNewsData = () => {
  const newsQuery = useInfiniteQuery({
    queryKey: queryKeys.news.page({ page: 1, limit: NEWS_PAGE_LIMIT }),
    queryFn: async ({ pageParam }) => {
      try {
        return await getNewsPage({
          page: pageParam,
          limit: NEWS_PAGE_LIMIT,
          sortBy: "date",
          direction: "desc",
        });
      } catch (error) {
        reportError(error, {
          page: "News",
          action: "load_news_page",
        });
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage && lastPage.page ? lastPage.page + 1 : undefined,
    enabled: true,
    refetchInterval: SANITY_FRESHNESS.news.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.news.staleTime,
  });

  const news = useMemo(
    () => sortNews(newsQuery.data?.pages.flatMap((page) => page.items) ?? []),
    [newsQuery.data]
  );
  const loading =
    newsQuery.isLoading && typeof newsQuery.data === "undefined";
  const error = Boolean(
    newsQuery.error && typeof newsQuery.data === "undefined"
  );

  return {
    news,
    loading,
    error,
    hasMore: Boolean(newsQuery.hasNextPage),
    loadingMore: newsQuery.isFetchingNextPage,
    fetchNextPage: async () => {
      await newsQuery.fetchNextPage();
    },
    refetch: async () => {
      await newsQuery.refetch();
    },
  };
};
