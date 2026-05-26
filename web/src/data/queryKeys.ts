export const queryKeys = {
  home: {
    critical: ["home", "critical"] as const,
    deferred: ["home", "deferred"] as const,
  },
  games: {
    all: ["games"] as const,
    latest: ["games", "latest"] as const,
    finished: ["games", "finished"] as const,
    tournamentFinished: ["games", "tournament-finished"] as const,
  },
  events: {
    goals: (year?: number) =>
      year ? (["events", "goals", year] as const) : (["events", "goals"] as const),
  },
  players: {
    all: ["players"] as const,
    bySlug: (slug: string) => ["players", "slug", slug] as const,
  },
  staff: {
    all: ["staff"] as const,
    bySlug: (slug: string) => ["staff", "slug", slug] as const,
  },
  news: {
    all: ["news"] as const,
    bySlug: (slug: string) => ["news", "slug", slug] as const,
    suggested: (slug: string) => ["news", "suggested", slug] as const,
  },
  reactions: {
    byTarget: (targetType: string, targetId: string) =>
      ["reactions", targetType, targetId] as const,
  },
  comments: {
    byNews: (newsId: string, sort: string) =>
      ["comments", "news", newsId, sort] as const,
    moderation: ["comments", "moderation"] as const,
  },
  dashboard: {
    news: {
      all: ["dashboard", "news"] as const,
      byId: (id: string) => ["dashboard", "news", id] as const,
    },
    matches: {
      all: ["dashboard", "matches"] as const,
      byId: (id: string) => ["dashboard", "matches", id] as const,
      options: ["dashboard", "matches", "options"] as const,
    },
    galleries: {
      all: ["dashboard", "galleries"] as const,
      byId: (id: string) => ["dashboard", "galleries", id] as const,
      options: ["dashboard", "galleries", "options"] as const,
    },
    players: {
      all: ["dashboard", "players"] as const,
      byId: (id: string) => ["dashboard", "players", id] as const,
    },
    staff: {
      all: ["dashboard", "staff"] as const,
      byId: (id: string) => ["dashboard", "staff", id] as const,
    },
    organizations: {
      all: ["dashboard", "organizations"] as const,
      byId: (id: string) => ["dashboard", "organizations", id] as const,
    },
    teams: {
      all: ["dashboard", "teams"] as const,
      byId: (id: string) => ["dashboard", "teams", id] as const,
    },
    table: {
      all: ["dashboard", "table"] as const,
      byId: (id: string) => ["dashboard", "table", id] as const,
      options: ["dashboard", "table", "options"] as const,
    },
    tournaments: {
      all: ["dashboard", "tournaments"] as const,
      byId: (id: string) => ["dashboard", "tournaments", id] as const,
      options: ["dashboard", "tournaments", "options"] as const,
    },
  },
  galleries: {
    all: ["galleries"] as const,
    bySlug: (slug: string) => ["galleries", "slug", slug] as const,
  },
  tournaments: {
    current: ["tournaments", "current"] as const,
  },
  teams: {
    all: ["teams"] as const,
  },
} as const;
