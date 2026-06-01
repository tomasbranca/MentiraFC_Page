import type {
  NewsContentBlock,
  NewsItem,
  NewsListItem,
} from "../../../types/models";
import {
  getSanitySlugValue,
  sanityNewsSchema,
  type SanityNews,
} from "../schemas";
import { validateSanityArray, validateSanityItem } from "../validation";

export const adaptSingleNews = (item: unknown): NewsItem | null => {
  const validated = validateSanityItem(
    sanityNewsSchema,
    item,
    "news.adapter:adaptSingleNews"
  );
  if (!validated) return null;

  const content = validated.content as NewsContentBlock[] | null | undefined;

  return {
    id: validated._id,
    title: validated.title,
    description: validated.description,
    content: content ?? undefined,
    date: validated.date,
    slug: getSanitySlugValue(validated.slug) ?? "",
    imageAlt: validated.imageAlt,
    imageUrl: validated.imageUrl,
  };
};

export const adaptSingleNewsListItem = (item: unknown): NewsListItem | null => {
  const news = adaptSingleNews(item);

  if (!news) {
    return null;
  }

  return {
    id: news.id,
    title: news.title,
    description: news.description,
    date: news.date,
    slug: news.slug,
    imageAlt: news.imageAlt,
    imageUrl: news.imageUrl,
  };
};

export const adaptNews = (news: unknown): NewsItem[] => {
  const validatedNews: SanityNews[] = validateSanityArray(
    sanityNewsSchema,
    news,
    "news.adapter:adaptNews"
  );

  return validatedNews
    .map(adaptSingleNews)
    .filter((item): item is NewsItem => Boolean(item && item.slug));
};

export const adaptNewsListItems = (news: unknown): NewsListItem[] =>
  adaptNews(news).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    date: item.date,
    slug: item.slug,
    imageAlt: item.imageAlt,
    imageUrl: item.imageUrl,
  }));
