import { getAllGames, getLatestGame } from "./games";
import {
  createEmptyInitialData,
  getHomeCriticalData,
  getInitialData,
  type InitialDataPayload,
} from "./getInitialData";
import { getNewsBySlug, getSuggestedNews } from "./news";
import { getPlayerBySlug } from "./players";

import { getPlayerStats } from "../domain/stats";
import { reportError } from "../lib/errors/errorLogger";
import { ROUTES } from "../presentation/constants/routes.constants";

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractSlugFromPathname = (
  pathname: string,
  routePattern: string
): string | null => {
  // Route constants generate concrete paths, so the dynamic slug segment is
  // converted to a local regex instead of duplicating route strings by hand.
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

const getNewsDetailInitialData = async (
  slug: string
): Promise<InitialDataPayload> => {
  try {
    const [newsItem, suggestedNews, latestGame] = await Promise.all([
      getNewsBySlug(slug),
      getSuggestedNews(slug),
      getLatestGame(),
    ]);

    return {
      ...createEmptyInitialData(),
      bootstrapScope: "news-detail",
      latestGame,
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

const getPlayerDetailInitialData = async (
  slug: string
): Promise<InitialDataPayload> => {
  try {
    const year = new Date().getFullYear();
    const [player, latestGame] = await Promise.all([
      getPlayerBySlug(slug),
      getLatestGame(),
    ]);

    if (!player) {
      return {
        ...createEmptyInitialData(),
        bootstrapScope: "player-detail",
        latestGame,
        currentPlayerDetail: {
          slug,
          player: null,
          goalsThisYear: 0,
          year,
        },
      };
    }

    const games = await getAllGames();
    const stats = getPlayerStats(games, player.id, { year });

    return {
      ...createEmptyInitialData(),
      bootstrapScope: "player-detail",
      latestGame,
      currentPlayerDetail: {
        slug,
        player,
        goalsThisYear: stats.goals,
        year,
      },
    };
  } catch (error) {
    reportError(error, {
      scope: "data:getRouteInitialData",
      action: "load_player_detail_initial_data",
      slug,
    });

    throw error;
  }
};

export const getRouteInitialData = async (
  pathname: string
): Promise<InitialDataPayload> => {
  // Each route gets the smallest useful bootstrap payload; generic pages fall
  // back to the full dataset because they depend on shared widgets.
  if (pathname === ROUTES.HOME) {
    return getHomeCriticalData();
  }

  const newsSlug = extractSlugFromPathname(
    pathname,
    ROUTES.NEWS_DETAIL(":slug")
  );

  if (newsSlug) {
    return getNewsDetailInitialData(newsSlug);
  }

  const playerSlug = extractSlugFromPathname(
    pathname,
    ROUTES.PLAYER_DETAIL(":slug")
  );

  if (playerSlug) {
    return getPlayerDetailInitialData(playerSlug);
  }

  return getInitialData();
};
