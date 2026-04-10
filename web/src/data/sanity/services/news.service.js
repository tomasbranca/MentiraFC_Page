import { client } from "../sanity.client";
import {
  NEWS_QUERY,
  NEWS_BY_SLUG_QUERY,
  SUGGESTED_NEWS_QUERY,
  FALLBACK_NEWS_QUERY,
} from "../queries/news.queries";

import {
  adaptNews,
  adaptSingleNews,
} from "../adapters/news.adapter";

const MIN_RESULTS = 3;

export const getNews = async () => {
  const data = await client.fetch(NEWS_QUERY);
  return adaptNews(data);
};

export const getNewsBySlug = async (slug) => {
  const data = await client.fetch(NEWS_BY_SLUG_QUERY, { slug });
  return adaptSingleNews(data);
};

export const getSuggestedNews = async (currentSlug) => {
  const now = new Date();

  const buildDate = (monthsBack) => {
    const d = new Date();
    d.setMonth(now.getMonth() - monthsBack);
    return d.toISOString();
  };

  // 1️⃣ últimos 2 meses
  let result = await client.fetch(SUGGESTED_NEWS_QUERY, {
    slug: currentSlug,
    date: buildDate(2),
  });

  if (result.length < MIN_RESULTS) {
    // 2️⃣ últimos 4 meses
    result = await client.fetch(SUGGESTED_NEWS_QUERY, {
      slug: currentSlug,
      date: buildDate(4),
    });
  }

  if (result.length < MIN_RESULTS) {
    // 3️⃣ fallback total
    result = await client.fetch(FALLBACK_NEWS_QUERY, {
      slug: currentSlug,
    });
  }

  return adaptNews(result);
};