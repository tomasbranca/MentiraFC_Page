const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const SANITY_FRESHNESS = {
  latestGame: {
    staleTime: 15 * SECOND,
    refetchInterval: 30 * SECOND,
  },
  liveStats: {
    staleTime: 30 * SECOND,
    refetchInterval: MINUTE,
  },
  news: {
    staleTime: MINUTE,
    refetchInterval: 2 * MINUTE,
  },
  semiDynamic: {
    staleTime: 2 * MINUTE,
    refetchInterval: 5 * MINUTE,
  },
  static: {
    staleTime: 10 * MINUTE,
  },
  dashboard: {
    staleTime: 0,
    refetchOnMount: "always" as const,
  },
} as const;
