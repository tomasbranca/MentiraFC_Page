import { getAllGames } from "./games";
import {
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

const getBasePayload = (): InitialDataPayload => ({
  bootstrapScope: "empty",
  news: [],
  players: [],
  games: [],
  tournament: null,
  teams: [],
  tournamentGames: [],
  latestGame: null,
});

const getNewsDetailInitialData = async (
  slug: string
): Promise<InitialDataPayload> => {
  try {
    const [newsItem, suggestedNews] = await Promise.all([
      getNewsBySlug(slug),
      getSuggestedNews(slug),
    ]);

    return {
      ...getBasePayload(),
      bootstrapScope: "news-detail",
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
    const player = await getPlayerBySlug(slug);

    if (!player) {
      return {
        ...getBasePayload(),
        bootstrapScope: "player-detail",
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
      ...getBasePayload(),
      bootstrapScope: "player-detail",
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
