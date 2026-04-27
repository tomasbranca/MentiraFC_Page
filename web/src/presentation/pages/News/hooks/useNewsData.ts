// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react";

import { getNews } from "../../../../data/news";
import { reportError } from "../../../../lib/errors/errorLogger";
import { useInitialData } from "../../../context/InitialDataContext";
import { sortNews } from "../../../utils/news.utils";

export const useNewsData = () => {
  const { initialData } = useInitialData();
  const [overrideNews, setOverrideNews] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const news = useMemo(() => {
    const source = overrideNews ?? initialData.news;
    return sortNews(source);
  }, [initialData.news, overrideNews]);

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
    const needsFullNews =
      initialData.bootstrapScope === "home-critical" || news.length === 0;

    if (!needsFullNews || loading || hasAttemptedFetch) {
      return;
    }

    void refetch();
  }, [hasAttemptedFetch, initialData.bootstrapScope, loading, news.length, refetch]);

  return { news, loading, error, refetch };
};
