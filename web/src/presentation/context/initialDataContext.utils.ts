import type { InitialDataPayload } from "../../data/getInitialData";
import type { BootstrapScope } from "../../types/models";

export const HOME_CRITICAL_BACKGROUND_STALE_TIME = 1000 * 60;

export const shouldLoadHomeCriticalData = (
  newsCount: number,
  bootstrapScope: BootstrapScope
): boolean =>
  newsCount === 0 &&
  (bootstrapScope === "news-detail" || bootstrapScope === "player-detail");

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
});
