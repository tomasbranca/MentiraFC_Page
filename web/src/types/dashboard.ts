import type { NewsContentBlock, NewsImageContentBlock } from "./models";

export const DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DASHBOARD_NEWS_IMAGE_ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

export const DASHBOARD_NEWS_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const DASHBOARD_NEWS_IMAGE_MAX_MEGAPIXELS = 256;

export type DashboardNewsItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  slug: string;
  imageAlt?: string | null;
  imageAssetId?: string | null;
  imageUrl?: string | null;
  content?: NewsContentBlock[];
};

export type DashboardNewsInput = {
  title: string;
  description: string;
  date: string;
  slug: string;
  imageAlt: string;
};

export type DashboardNewsImageContentBlock = NewsImageContentBlock & {
  uploadKey?: string;
};

export type DashboardNewsContentBlock =
  | Exclude<NewsContentBlock, NewsImageContentBlock>
  | DashboardNewsImageContentBlock;

export type DashboardNewsMutationInput = DashboardNewsInput & {
  coverImage?: File | null;
  useDefaultImage?: boolean;
  content: DashboardNewsContentBlock[];
  contentImageFiles?: Record<string, File>;
};
