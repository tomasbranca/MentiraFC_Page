import type { NewsContentBlock, NewsItem } from "../../../types/models";
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
    imageUrl: validated.imageUrl,
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
