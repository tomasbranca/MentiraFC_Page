import type { NewsItem } from "../../../types/models";

export const splitNewsForPage = (
  news: NewsItem[] = [],
  featuredCount = 6
) => {
  return {
    featured: news.slice(0, featuredCount),
    list: news.slice(featuredCount),
  };
};
