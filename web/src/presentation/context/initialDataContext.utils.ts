import type { InitialDataPayload } from "../../data/getInitialData";
import type { BootstrapScope } from "../../types/models";
import { ROUTES } from "../constants/routes.constants";

export const HOME_CRITICAL_BACKGROUND_STALE_TIME = 1000 * 60;

type HomeCriticalLoadState = {
  newsCount: number;
  bootstrapScope: BootstrapScope;
  pathname: string;
  previousPathname: string | null;
};

export const shouldLoadHomeCriticalData = ({
  newsCount,
  bootstrapScope,
  pathname,
  previousPathname,
}: HomeCriticalLoadState): boolean => {
  const isDetailRouteWithoutHomeData =
    bootstrapScope === "news-detail" ||
    bootstrapScope === "player-detail" ||
    bootstrapScope === "staff-detail";
  const isReturningHomeFromLogin =
    bootstrapScope === "empty" &&
    previousPathname === ROUTES.LOGIN &&
    pathname === ROUTES.HOME;

  return (
    newsCount === 0 && (isDetailRouteWithoutHomeData || isReturningHomeFromLogin)
  );
};

export const mergeHomeCriticalIntoInitialData = (
  previousData: InitialDataPayload,
  homeData: InitialDataPayload
): InitialDataPayload => ({
  ...previousData,
  ...homeData,
  // Preserve route-specific payloads while background home data refreshes the
  // shared widgets used by detail pages.
  currentNewsDetail: previousData.currentNewsDetail,
  currentPlayerDetail: previousData.currentPlayerDetail,
  currentStaffDetail: previousData.currentStaffDetail,
});
