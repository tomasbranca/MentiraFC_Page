export const queryKeys = {
  games: {
    all: ["games"] as const,
    latest: ["games", "latest"] as const,
    finished: ["games", "finished"] as const,
    tournamentFinished: ["games", "tournament-finished"] as const,
  },
  players: {
    all: ["players"] as const,
    bySlug: (slug: string) => ["players", "slug", slug] as const,
  },
  news: {
    all: ["news"] as const,
    bySlug: (slug: string) => ["news", "slug", slug] as const,
    suggested: (slug: string) => ["news", "suggested", slug] as const,
  },
  tournaments: {
    current: ["tournaments", "current"] as const,
  },
  teams: {
    all: ["teams"] as const,
  },
} as const;
