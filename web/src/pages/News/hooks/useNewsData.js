import { useEffect, useState } from "react";
import { getNews } from "../../../lib/sanity/services/news.service";
import { sortNews } from "../../../utils/news.utils";

export const useNewsData = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNews()
      .then((data) => setNews(sortNews(data)))
      .finally(() => setLoading(false));
  }, []);

  return { news, loading };
};