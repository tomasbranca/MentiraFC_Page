// @ts-nocheck
import { ROUTES } from "../constants/routes.constants";

export const getNewsLink = (item: { slug: string }): string => {
  return ROUTES.NEWS_DETAIL(item.slug);
};
