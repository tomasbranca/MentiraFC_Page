import { useCallback } from "react";
import { getNews } from "../../../data/news";
import { sortNews } from "../../../utils/news.utils";
import { useFetchData } from "../../../hooks/useFetchData";

export const useNewsData = () => {
  const fetcher = useCallback(async () => {
    const data = await getNews();
    return sortNews(data);
  }, []);

  const { data: news, loading, error } = useFetchData(fetcher, {
    initialData: [],
  });

  return { news, loading, error: Boolean(error) };
};
