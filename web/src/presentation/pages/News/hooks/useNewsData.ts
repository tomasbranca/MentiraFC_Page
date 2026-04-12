// @ts-nocheck
import { useQuery } from "@tanstack/react-query";

import { getNews } from "../../../../data/news";
import { queryKeys } from "../../../../data/queryKeys";
import { reportError } from "../../../../lib/errors/errorLogger";
import { sortNews } from "../../../utils/news.utils";

export const useNewsData = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.news.all,
    queryFn: async () => {
      try {
        const news = await getNews();
        return sortNews(news);
      } catch (error) {
        reportError(error, {
          page: "News",
          action: "load_news",
        });
        throw error;
      }
    },
  });

  return { news: data ?? [], loading: isLoading, error: isError, refetch };
};
