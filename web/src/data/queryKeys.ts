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
} as const;
