import type { NewsItem } from "../../../types/models";

type SanitySlug = { current?: string } | string | undefined;
type SanityNews = {
  _id: string;
  title: string;
  description?: string;
  content?: unknown;
  date: string;
  slug?: SanitySlug;
  imageUrl?: string | null;
};

export const adaptSingleNews = (item: SanityNews | null | undefined): NewsItem | null => {
  if (!item) return null;

  return {
    id: item._id,
    title: item.title,
    description: item.description,
    content: item.content,
    date: item.date,
    slug: typeof item.slug === "string" ? item.slug : item.slug?.current || "",
    imageUrl: item.imageUrl,
  };
};

export const adaptNews = (news: SanityNews[] = []): NewsItem[] => {
  return news
    .map(adaptSingleNews)
    .filter((item): item is NewsItem => Boolean(item && item.slug));
};
