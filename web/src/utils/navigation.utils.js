import { ROUTES } from "../constants/routes.constants";

export const getNewsLink = (item) => {
  return ROUTES.NEWS_DETAIL(item.slug.current);
};