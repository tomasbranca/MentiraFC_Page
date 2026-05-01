import type { NewsItem } from "../../types/models";

export const sortNews = (news: NewsItem[] = []): NewsItem[] =>
  [...news].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
