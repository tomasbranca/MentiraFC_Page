import {
  getNews as fetchNews,
  getNewsBySlug as fetchNewsBySlug,
  getSuggestedNews as fetchSuggestedNews,
} from "./sanity/services/news.service";

export const getNews = async () => fetchNews();

export const getNewsBySlug = async (slug) => fetchNewsBySlug(slug);

export const getSuggestedNews = async (currentSlug) => fetchSuggestedNews(currentSlug);
