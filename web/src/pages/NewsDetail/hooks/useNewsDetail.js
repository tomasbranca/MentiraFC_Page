import { useEffect, useState } from "react";
import { getNewsBySlug, getSuggestedNews } from "../../../lib/sanity/services/news.service";

import { selectSuggestedNews } from "../newsDetail.utils";

export const useNewsDetail = (slug) => {
  const [newsItem, setNewsItem] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getNewsBySlug(slug);
        setNewsItem(data);

        const suggestedNews = await getSuggestedNews(slug);

        const selected = selectSuggestedNews(suggestedNews);

        if (selected.length >= 3) {
          setSuggested(selected);
        }
      } catch (error) {
        console.error("Error cargando noticia:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  return { newsItem, suggested, loading };
};