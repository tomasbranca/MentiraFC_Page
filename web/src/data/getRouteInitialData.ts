import { getNewsBySlug, getSuggestedNews } from "./news";
import { getInitialData, type InitialDataPayload } from "./getInitialData";

import { ROUTES } from "../presentation/constants/routes.constants";
import { reportError } from "../lib/errors/errorLogger";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const extractNewsSlugFromPathname = (
  pathname: string
): string | null => {
  const routePattern = ROUTES.NEWS_DETAIL(":slug");
  const matcher = new RegExp(
    `^${escapeRegex(routePattern).replace(
      escapeRegex(":slug"),
      "(?<slug>[^/]+)"
    )}/?$`
  );

  const match = pathname.match(matcher);
  const slug = match?.groups?.slug;

  return slug ?? null;
};

export const getRouteInitialData = async (
  pathname: string
): Promise<InitialDataPayload> => {
  const payload = await getInitialData();
  const slug = extractNewsSlugFromPathname(pathname);

  if (!slug) {
    return payload;
  }

  try {
    const [newsItem, suggestedNews] = await Promise.all([
      getNewsBySlug(slug),
      getSuggestedNews(slug),
    ]);

    return {
      ...payload,
      currentNewsDetail: {
        slug,
        newsItem,
        suggestedNews,
      },
    };
  } catch (error) {
    reportError(error, {
      scope: "data:getRouteInitialData",
      action: "load_news_detail_initial_data",
      slug,
    });

    throw error;
  }
};
