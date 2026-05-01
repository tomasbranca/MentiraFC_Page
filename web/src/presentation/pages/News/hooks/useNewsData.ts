import { useCallback, useEffect, useMemo, useState } from "react";

import { getNews } from "../../../../data/news";
import { reportError } from "../../../../lib/errors/errorLogger";
import { shouldLoadNewsInitially } from "../../../hooks/loading/loadingState.utils";
import { useInitialData } from "../../../context/InitialDataContext";
import { sortNews } from "../../../utils/news.utils";
import type { NewsItem } from "../../../../types/models";

export const useNewsData = () => {
  const { initialData } = useInitialData();
  const [overrideNews, setOverrideNews] = useState<NewsItem[] | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [error, setError] = useState(false);

  const news = useMemo(() => {
    const source = overrideNews ?? initialData.news;
    return sortNews(source);
  }, [initialData.news, overrideNews]);
  const needsInitialFetch = shouldLoadNewsInitially(
    initialData.bootstrapScope,
    news.length
  );
  const [loading, setLoading] = useState(needsInitialFetch);

  const refetch = useCallback(async () => {
    setLoading(true);

    try {
      const nextNews = await getNews();
      setOverrideNews(nextNews);
      setError(false);
    } catch (nextError) {
      setError(true);
      reportError(nextError, {
        page: "News",
        action: "refresh_news",
      });
    } finally {
      setHasAttemptedFetch(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!needsInitialFetch || hasAttemptedFetch) {
      return;
    }

    void refetch();
  }, [hasAttemptedFetch, needsInitialFetch, refetch]);

  return { news, loading, error, refetch };
};
