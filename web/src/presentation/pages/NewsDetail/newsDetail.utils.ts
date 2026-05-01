import type { NewsItem } from "../../../types/models";

export const shuffleArray = <T>(array: T[] = []): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const selectSuggestedNews = (
  news: NewsItem[] = [],
  count = 3
): NewsItem[] => {
  return shuffleArray(news).slice(0, count);
};
