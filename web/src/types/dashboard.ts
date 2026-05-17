import type { NewsContentBlock } from "./models";

export type DashboardNewsItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  slug: string;
  imageUrl?: string | null;
  content?: NewsContentBlock[];
};

export type DashboardNewsInput = {
  title: string;
  description: string;
  date: string;
  slug: string;
};
