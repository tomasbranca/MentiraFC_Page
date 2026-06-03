export const queryKeys = {
  home: {
    critical: ["home", "critical"] as const,
    deferred: ["home", "deferred"] as const,
  },
  games: {
    all: ["games"] as const,
    latest: ["games", "latest"] as const,
    finished: ["games", "finished"] as const,
    finishedPage: (params: { page: number; limit: number }) =>
      ["games", "finished", "page", params] as const,
    finishedDetail: (id: string) => ["games", "finished", "detail", id] as const,
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
    page: (params: { page: number; limit: number }) =>
      ["news", "page", params] as const,
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
  footerSettings: ["footer-settings"] as const,
  admin: {
    users: ["admin", "users"] as const,
    roles: ["admin", "roles"] as const,
    footerSettings: ["admin", "footer-settings"] as const,
    auditLog: ["admin", "audit-log"] as const,
    metrics: ["admin", "metrics"] as const,
    authControls: ["admin", "auth-controls"] as const,
    featureFlags: ["admin", "feature-flags"] as const,
    maintenance: ["admin", "maintenance"] as const,
    publicMaintenance: ["admin", "maintenance", "public"] as const,
  },
  dashboard: {
    news: {
      all: ["dashboard", "news"] as const,
      page: (params: {
        page?: number;
        limit?: number;
        sortBy?: string;
        direction?: string;
        search?: string | null;
        status?: string;
      }) => ["dashboard", "news", "page", params] as const,
      byId: (id: string) => ["dashboard", "news", id] as const,
    },
    matches: {
      all: ["dashboard", "matches"] as const,
      page: (params: {
        page?: number;
        limit?: number;
        sortBy?: string;
        direction?: string;
        search?: string | null;
        status?: string;
        state?: string;
        competition?: string;
      }) => ["dashboard", "matches", "page", params] as const,
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
    page: (params: { page: number; limit: number }) =>
      ["galleries", "page", params] as const,
    bySlug: (slug: string) => ["galleries", "slug", slug] as const,
  },
  tournaments: {
    current: ["tournaments", "current"] as const,
  },
  teams: {
    all: ["teams"] as const,
  },
} as const;
