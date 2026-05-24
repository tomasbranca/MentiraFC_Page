import { type QueryClient, queryOptions } from "@tanstack/react-query";

import {
  fetchDashboardNews,
  fetchDashboardNewsById,
} from "../../../data/dashboardNews";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardNewsItem } from "../../../types/dashboard";

export const dashboardNewsListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.news.all,
    queryFn: async () => {
      try {
        return await fetchDashboardNews();
      } catch (error) {
        reportError(error, {
          page: "DashboardNewsList",
          action: "load_news",
        });
        throw error;
      }
    },
  });

export const dashboardNewsDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.dashboard.news.byId(id),
    queryFn: async () => {
      try {
        return await fetchDashboardNewsById(id);
      } catch (error) {
        reportError(error, {
          page: "DashboardNewsForm",
          action: "load_news",
          id,
        });
        throw error;
      }
    },
  });

export const invalidateDashboardNewsList = async (
  queryClient: QueryClient
) => {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.news.all,
  });
};

export const invalidateDashboardNewsPublishDependencies = async (
  queryClient: QueryClient
) => {
  await Promise.all([
    invalidateDashboardNewsList(queryClient),
    queryClient.invalidateQueries({ queryKey: queryKeys.news.all }),
  ]);
};

export const cacheDashboardNews = (
  queryClient: QueryClient,
  news: DashboardNewsItem
) => {
  queryClient.setQueryData(queryKeys.dashboard.news.byId(news.id), news);
};
