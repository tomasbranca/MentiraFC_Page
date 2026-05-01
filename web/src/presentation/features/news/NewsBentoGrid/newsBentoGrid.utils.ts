import type { NewsItem } from "../../../../types/models";

export const mapBentoItems = (items: NewsItem[] = []) => {
  return {
    hero: items[0] || null,
    featuredBox: items[1] || null,
    featuredWide: items[2] || null,
    compact: items.slice(3, 6),
  };
};
