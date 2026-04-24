import {
  getNews as fetchNews,
  getNewsBySlug as fetchNewsBySlug,
  getSuggestedNews as fetchSuggestedNews,
} from "./sanity/services/news.service";

import type { NewsItem } from "../types/models";

export const getNews = async (): Promise<NewsItem[]> => fetchNews();

export const getNewsBySlug = async (slug: string): Promise<NewsItem | null> =>
  fetchNewsBySlug(slug);

export const getSuggestedNews = async (
  currentSlug: string
): Promise<NewsItem[]> => fetchSuggestedNews(currentSlug);
