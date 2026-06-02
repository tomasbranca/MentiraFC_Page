import { getAllGames, getLatestGame } from "./games";
import { getGoalEvents } from "./events";
import { getFooterSettings } from "./footerSettings";
import { getGalleryBySlug } from "./galleries";
import {
  createEmptyInitialData,
  getHomeCriticalData,
  getInitialData,
  type InitialDataPayload,
} from "./getInitialData";
import { getNewsBySlug, getSuggestedNews } from "./news";
import { getPlayerBySlug } from "./players";
import { getStaffMemberBySlug } from "./staff";

import { getPlayerStats } from "../domain/stats";
import { reportError } from "../lib/errors/errorLogger";
import { ROUTES } from "../shared/routing";

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
    const [newsItem, suggestedNews, latestGame, footerSettings] = await Promise.all([
      getNewsBySlug(slug),
      getSuggestedNews(slug),
      getLatestGame(),
      getFooterSettings(),
    ]);

    return {
      ...createEmptyInitialData(),
      bootstrapScope: "news-detail",
      latestGame,
      footerSettings,
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

const getNewsListInitialData = async (): Promise<InitialDataPayload> => {
  try {
    const [latestGame, footerSettings] = await Promise.all([
      getLatestGame(),
      getFooterSettings(),
    ]);

    return {
      ...createEmptyInitialData(),
      bootstrapScope: "news-list",
      latestGame,
      footerSettings,
    };
  } catch (error) {
    reportError(error, {
      scope: "data:getRouteInitialData",
      action: "load_news_list_initial_data",
    });

    throw error;
  }
};

const getGalleryListInitialData = async (): Promise<InitialDataPayload> => {
  try {
    const [latestGame, footerSettings] = await Promise.all([
      getLatestGame(),
      getFooterSettings(),
    ]);

    return {
      ...createEmptyInitialData(),
      bootstrapScope: "gallery-list",
      latestGame,
      footerSettings,
    };
  } catch (error) {
    reportError(error, {
      scope: "data:getRouteInitialData",
      action: "load_gallery_list_initial_data",
    });

    throw error;
  }
};

const getGalleryDetailInitialData = async (
  slug: string
): Promise<InitialDataPayload> => {
  try {
    const [gallery, latestGame, footerSettings] = await Promise.all([
      getGalleryBySlug(slug),
      getLatestGame(),
      getFooterSettings(),
    ]);

    return {
      ...createEmptyInitialData(),
      bootstrapScope: "gallery-detail",
      latestGame,
      footerSettings,
      currentGalleryDetail: {
        slug,
        gallery,
      },
    };
  } catch (error) {
    reportError(error, {
      scope: "data:getRouteInitialData",
      action: "load_gallery_detail_initial_data",
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
    const [player, latestGame, goalEvents, footerSettings] = await Promise.all([
      getPlayerBySlug(slug),
      getLatestGame(),
      getGoalEvents({ year }),
      getFooterSettings(),
    ]);

    if (!player) {
      return {
        ...createEmptyInitialData(),
        bootstrapScope: "player-detail",
        latestGame,
        footerSettings,
        currentPlayerDetail: {
          slug,
          player: null,
          goalsThisYear: 0,
          matchesPlayedThisYear: 0,
          year,
        },
      };
    }

    const games = await getAllGames();
    const stats = getPlayerStats(games, player.id, { year, goalEvents });

    return {
      ...createEmptyInitialData(),
      bootstrapScope: "player-detail",
      latestGame,
      footerSettings,
      currentPlayerDetail: {
        slug,
        player,
        goalsThisYear: stats.goals,
        matchesPlayedThisYear: stats.matchesPlayed,
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

const getStaffDetailInitialData = async (
  slug: string
): Promise<InitialDataPayload> => {
  try {
    const [staffMember, latestGame, footerSettings] = await Promise.all([
      getStaffMemberBySlug(slug),
      getLatestGame(),
      getFooterSettings(),
    ]);

    return {
      ...createEmptyInitialData(),
      bootstrapScope: "staff-detail",
      latestGame,
      footerSettings,
      currentStaffDetail: {
        slug,
        staffMember,
      },
    };
  } catch (error) {
    reportError(error, {
      scope: "data:getRouteInitialData",
      action: "load_staff_detail_initial_data",
      slug,
    });

    throw error;
  }
};

export const getRouteInitialData = async (
  pathname: string
): Promise<InitialDataPayload> => {
  const normalizedPathname =
    pathname === ROUTES.HOME ? pathname : pathname.replace(/\/+$/, "");
  const isDashboardPathname =
    normalizedPathname === ROUTES.DASHBOARD ||
    normalizedPathname.startsWith(`${ROUTES.DASHBOARD}/`);
  const isAdminPathname =
    normalizedPathname === ROUTES.ADMIN ||
    normalizedPathname.startsWith(`${ROUTES.ADMIN}/`);

  // Each route gets the smallest useful bootstrap payload; generic pages fall
  // back to the full dataset because they depend on shared widgets.
  if (
    normalizedPathname === ROUTES.LOGIN ||
    normalizedPathname === ROUTES.PASSWORD_RESET_REQUEST ||
    normalizedPathname === ROUTES.PASSWORD_RESET_UPDATE ||
    normalizedPathname === ROUTES.ACCOUNT ||
    isDashboardPathname ||
    isAdminPathname
  ) {
    return createEmptyInitialData();
  }

  if (normalizedPathname === ROUTES.HOME) {
    return getHomeCriticalData();
  }

  if (normalizedPathname === ROUTES.NEWS) {
    return getNewsListInitialData();
  }

  if (normalizedPathname === ROUTES.GALLERY) {
    return getGalleryListInitialData();
  }

  const newsSlug = extractSlugFromPathname(
    pathname,
    ROUTES.NEWS_DETAIL(":slug")
  );

  if (newsSlug) {
    return getNewsDetailInitialData(newsSlug);
  }

  const gallerySlug = extractSlugFromPathname(
    pathname,
    ROUTES.GALLERY_DETAIL(":slug")
  );

  if (gallerySlug) {
    return getGalleryDetailInitialData(gallerySlug);
  }

  const staffSlug = extractSlugFromPathname(
    pathname,
    ROUTES.STAFF_DETAIL(":slug")
  );

  if (staffSlug) {
    return getStaffDetailInitialData(staffSlug);
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
