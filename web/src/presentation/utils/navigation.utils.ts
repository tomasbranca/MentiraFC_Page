import { ROUTES } from "../../shared/routing";

export const getNewsLink = (item: { slug: string }): string => {
  return ROUTES.NEWS_DETAIL(item.slug);
};

export const getGalleryLink = (item: { slug: string }): string => {
  return ROUTES.GALLERY_DETAIL(item.slug);
};
