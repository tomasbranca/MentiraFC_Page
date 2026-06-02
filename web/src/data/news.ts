import {
  getNews as fetchNews,
  getNewsPage as fetchNewsPage,
  getNewsBySlug as fetchNewsBySlug,
  getSuggestedNews as fetchSuggestedNews,
  type NewsPageSortBy,
} from "./sanity/services/news.service";

import type { PaginatedResult } from "../../shared/pagination";
import type { SanityPageOptions } from "./sanity/pagination";
import type { NewsItem, NewsListItem } from "../types/models";

export const getNews = async (): Promise<NewsItem[]> => fetchNews();

export const getNewsPage = async (
  options?: SanityPageOptions<NewsPageSortBy>
): Promise<PaginatedResult<NewsListItem>> => fetchNewsPage(options);

export const getNewsBySlug = async (slug: string): Promise<NewsItem | null> =>
  fetchNewsBySlug(slug);

export const getSuggestedNews = async (
  currentSlug: string
): Promise<NewsItem[]> => fetchSuggestedNews(currentSlug);
