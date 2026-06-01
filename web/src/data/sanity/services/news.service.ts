import {
  NEWS_QUERY,
  NEWS_BY_SLUG_QUERY,
  SUGGESTED_NEWS_QUERY,
  FALLBACK_NEWS_QUERY,
  NEWS_PAGE_SORT_BY,
  getNewsPageQuery,
  type NewsPageSortBy,
} from "../queries/news.queries";

import {
  adaptNews,
  adaptNewsListItems,
  adaptSingleNews,
} from "../adapters/news.adapter";
import { sanityFreshClient } from "../client";
import {
  buildSanityPageParams,
  buildSanityPaginatedResult,
  parseSanityPageOptions,
  type SanityPageOptions,
  type SanityPageQueryResult,
} from "../pagination";
import { normalizeSanitySlugParam } from "../requestParams";
import { fetchSanityQuery } from "../sanityFetch";
import type { NewsItem, NewsListItem } from "../../../types/models";
import type { PaginatedResult } from "../../../../shared/pagination";

const MIN_RESULTS = 3;

export type { NewsPageSortBy };

export const getNews = async (): Promise<NewsItem[]> => {
  const data = await fetchSanityQuery(NEWS_QUERY, {
    client: sanityFreshClient,
  });
  return adaptNews(data);
};

export const getNewsPage = async (
  options?: SanityPageOptions<NewsPageSortBy>
): Promise<PaginatedResult<NewsListItem>> => {
  const pagination = parseSanityPageOptions(options, {
    allowedSortBy: NEWS_PAGE_SORT_BY,
    defaultSortBy: "date",
  });
  const data = await fetchSanityQuery<SanityPageQueryResult>(
    getNewsPageQuery(pagination.sortBy, pagination.direction),
    {
      client: sanityFreshClient,
      params: buildSanityPageParams(pagination),
    }
  );

  return buildSanityPaginatedResult(
    adaptNewsListItems(data.items ?? []),
    data.total,
    pagination
  );
};

export const getNewsBySlug = async (slug: string): Promise<NewsItem | null> => {
  const normalizedSlug = normalizeSanitySlugParam(slug);

  if (!normalizedSlug) {
    return null;
  }

  const data = await fetchSanityQuery(NEWS_BY_SLUG_QUERY, {
    client: sanityFreshClient,
    params: { slug: normalizedSlug },
  });
  return adaptSingleNews(data);
};

export const getSuggestedNews = async (
  currentSlug: string
): Promise<NewsItem[]> => {
  const normalizedSlug = normalizeSanitySlugParam(currentSlug);

  if (!normalizedSlug) {
    return [];
  }

  const now = new Date();

  const buildDate = (monthsBack: number): string => {
    const d = new Date();
    d.setMonth(now.getMonth() - monthsBack);
    return d.toISOString();
  };

  const [shortWindow, longWindow, fallback] = await Promise.all([
    fetchSanityQuery<unknown[]>(SUGGESTED_NEWS_QUERY, {
      params: {
        slug: normalizedSlug,
        date: buildDate(2),
      },
    }),
    fetchSanityQuery<unknown[]>(SUGGESTED_NEWS_QUERY, {
      params: {
        slug: normalizedSlug,
        date: buildDate(4),
      },
    }),
    fetchSanityQuery<unknown[]>(FALLBACK_NEWS_QUERY, {
      params: {
        slug: normalizedSlug,
      },
    }),
  ]);

  const selectedResult =
    shortWindow.length >= MIN_RESULTS
      ? shortWindow
      : longWindow.length >= MIN_RESULTS
      ? longWindow
      : fallback;

  return adaptNews(selectedResult);
};
