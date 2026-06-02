import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getGamesPage } from "../../../../data/games";
import { queryKeys } from "../../../../data/queryKeys";
import { SANITY_FRESHNESS } from "../../../../data/sanity/freshness";
import { reportError } from "../../../../lib/errors/errorLogger";
import { PAGE_SIZE } from "../record.constants";

export const useRecordData = () => {
  const gamesQuery = useInfiniteQuery({
    queryKey: queryKeys.games.finishedPage({
      page: 1,
      limit: PAGE_SIZE,
    }),
    queryFn: async ({ pageParam }) => {
      try {
        return await getGamesPage({
          page: pageParam,
          limit: PAGE_SIZE,
          sortBy: "date",
          direction: "desc",
        });
      } catch (error) {
        reportError(error, {
          page: "Record",
          action: "load_record_page",
        });
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage && lastPage.page ? lastPage.page + 1 : undefined,
    enabled: true,
    refetchInterval: SANITY_FRESHNESS.liveStats.refetchInterval,
    refetchOnMount: "always",
    staleTime: SANITY_FRESHNESS.liveStats.staleTime,
  });

  const games = useMemo(
    () => gamesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [gamesQuery.data]
  );

  return {
    games,
    loading: gamesQuery.isLoading && typeof gamesQuery.data === "undefined",
    error: Boolean(gamesQuery.error && typeof gamesQuery.data === "undefined"),
    hasMore: Boolean(gamesQuery.hasNextPage),
    loadingMore: gamesQuery.isFetchingNextPage,
    fetchNextPage: async () => {
      await gamesQuery.fetchNextPage();
    },
    refetch: async () => {
      await gamesQuery.refetch();
    },
  };
};
