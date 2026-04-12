// @ts-nocheck
import { useCallback } from "react";
import { getNewsBySlug, getSuggestedNews } from "../../../../data/news";

import { selectSuggestedNews } from "../newsDetail.utils";
import { useFetchData } from "../../../hooks/useFetchData";

export const useNewsDetail = (slug) => {
  const fetcher = useCallback(async () => {
    const newsItem = await getNewsBySlug(slug);
    const suggestedNews = await getSuggestedNews(slug);

    const selected = selectSuggestedNews(suggestedNews);

    return {
      newsItem,
      suggested: selected.length >= 3 ? selected : [],
    };
  }, [slug]);

  const { data, loading, error, refetch } = useFetchData(fetcher, {
    initialData: {
      newsItem: null,
      suggested: [],
    },
    errorContext: {
      page: "NewsDetail",
      action: "load_news_detail",
      slug,
    },
  });

  return { ...data, loading, error: Boolean(error), refetch };
};
