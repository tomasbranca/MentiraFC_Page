import { useEffect, useState } from "react";
import { getNews } from "../../../data/news";
import { sortNews } from "../../../utils/news.utils";

export const useNewsData = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getNews()
      .then((data) => {
        setNews(sortNews(data));
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { news, loading, error };
};
