import { normalizeGameState } from "../domain/games";
import { getCurrentAccessToken } from "./auth";
import type {
  DashboardMatchDraftMutationInput,
  DashboardMatchCompetition,
  DashboardMatchItem,
  DashboardMatchMutationInput,
  DashboardMatchOptions,
  DashboardMatchState,
} from "../types/dashboard";
import type { PaginatedResult, SortDirection } from "../../shared/pagination";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardMatchPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  number: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
});

const dashboardMatchSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  date: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  state: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) =>
      value == null || value === "" ? null : normalizeGameState(value)
    ),
  location: z.string().nullable().optional(),
  competition: z.string().nullable().optional(),
  tournamentId: z.string().nullable().optional(),
  tournamentName: z.string().nullable().optional(),
  tournamentLabel: z.string().nullable().optional(),
  rivalId: z.string().nullable().optional(),
  rivalName: z.string().nullable().optional(),
  rivalImageUrl: z.string().nullable().optional(),
  result: z
    .object({
      goalsFor: z.number().nullable().optional(),
      goalsAgainst: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  playedPlayers: z.array(dashboardMatchPlayerSchema),
  goalScorers: z.array(
    dashboardMatchPlayerSchema.extend({
      goals: z.number(),
    })
  ),
  guestGoalScorers: z
    .array(
      z.object({
        name: z.string(),
        goals: z.number(),
      })
    )
    .default([]),
  opponentOwnGoals: z.number().int().min(0).default(0),
});

const dashboardMatchOptionsSchema = z.object({
  teams: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isMain: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
    })
  ),
  tournaments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      organizationName: z.string().nullable().optional(),
      active: z.boolean().optional(),
    })
  ),
  players: z.array(dashboardMatchPlayerSchema),
});

const dashboardMatchListSchema = z.array(dashboardMatchSchema);
const dashboardMatchPageSchema = z.object({
  items: z.array(dashboardMatchSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number(),
  totalPages: z.number().optional(),
  hasNextPage: z.boolean().optional(),
  hasPreviousPage: z.boolean().optional(),
  nextCursor: z.string().nullable().optional(),
  previousCursor: z.string().nullable().optional(),
});

const DASHBOARD_MATCHES_API_PATH = "/api/dashboard/matches";

type DashboardMatchMutationIntent = "draft" | "publish";
export type DashboardMatchesPageSortBy = "date" | "updatedAt" | "rivalName";
export type DashboardMatchesPageStatusFilter = "all" | "published" | "draft";
export type DashboardMatchesPageStateFilter = "all" | DashboardMatchState;
export type DashboardMatchesPageCompetitionFilter =
  | "all"
  | DashboardMatchCompetition;

export type DashboardMatchesPageOptions = {
  page?: number;
  limit?: number;
  sortBy?: DashboardMatchesPageSortBy;
  direction?: SortDirection;
  search?: string | null;
  status?: DashboardMatchesPageStatusFilter;
  state?: DashboardMatchesPageStateFilter;
  competition?: DashboardMatchesPageCompetitionFilter;
};

type DashboardMatchesApiOptions = DashboardMatchesPageOptions & {
  loadOptions?: boolean;
};

const buildDashboardMatchesApiPath = (
  id?: string | null,
  intent?: DashboardMatchMutationIntent,
  options?: DashboardMatchesApiOptions
): string => {
  const params = new URLSearchParams();
  const { loadOptions, ...pageOptions } = options ?? {};

  if (id) {
    params.set("id", id);
  }

  if (intent) {
    params.set("intent", intent);
  }

  if (loadOptions) {
    params.set("options", "1");
  }

  Object.entries(pageOptions).forEach(([key, value]) => {
    if (value != null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query
    ? `${DASHBOARD_MATCHES_API_PATH}?${query}`
    : DASHBOARD_MATCHES_API_PATH;
};

export const buildDashboardMatchItemApiPath = (id: string): string =>
  buildDashboardMatchesApiPath(id);

export const buildDashboardMatchOptionsApiPath = (): string =>
  buildDashboardMatchesApiPath(null, undefined, { loadOptions: true });

export const buildDashboardMatchesPageApiPath = (
  options: DashboardMatchesPageOptions = {}
): string => buildDashboardMatchesApiPath(null, undefined, options);

const fetchDashboardApi = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const accessToken = await getCurrentAccessToken();
  const headers = new Headers(init?.headers);

  headers.set("Authorization", `Bearer ${accessToken}`);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as {
        data?: T;
        error?: string;
      })
    : {
        error: contentType.includes("text/html")
          ? "La API del dashboard devolvio HTML en vez de JSON. Verifica la ruta de la Function en Vercel."
          : (await response.text()) ||
            `Dashboard request failed with status ${response.status}.`,
      };

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Dashboard request failed.");
  }

  return payload.data as T;
};

export const fetchDashboardMatches = async (): Promise<
  DashboardMatchItem[]
> => {
  const data = await fetchDashboardApi<unknown[]>(DASHBOARD_MATCHES_API_PATH);
  return dashboardMatchListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardMatchItem[];
};

export const fetchDashboardMatchesPage = async (
  options: DashboardMatchesPageOptions = {}
): Promise<PaginatedResult<DashboardMatchItem>> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardMatchesPageApiPath(options)
  );

  return dashboardMatchPageSchema.parse(
    data,
    zodParseOptions
  ) as PaginatedResult<DashboardMatchItem>;
};

export const fetchDashboardMatchById = async (
  id: string
): Promise<DashboardMatchItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardMatchItemApiPath(id)
  );
  return dashboardMatchSchema.parse(
    data,
    zodParseOptions
  ) as DashboardMatchItem;
};

export const fetchDashboardMatchOptions =
  async (): Promise<DashboardMatchOptions> => {
    const data = await fetchDashboardApi<unknown>(
      buildDashboardMatchOptionsApiPath()
    );
    return dashboardMatchOptionsSchema.parse(
      data,
      zodParseOptions
    ) as DashboardMatchOptions;
  };

export const publishDashboardMatch = async (
  input: DashboardMatchMutationInput
): Promise<DashboardMatchItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardMatchesApiPath(null, "publish"),
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return dashboardMatchSchema.parse(
    data,
    zodParseOptions
  ) as DashboardMatchItem;
};

export const publishDashboardMatchById = async (
  id: string,
  input: DashboardMatchMutationInput
): Promise<DashboardMatchItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardMatchesApiPath(id, "publish"),
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );

  return dashboardMatchSchema.parse(
    data,
    zodParseOptions
  ) as DashboardMatchItem;
};

export const saveDashboardMatchDraft = async (
  input: DashboardMatchDraftMutationInput,
  id?: string | null
): Promise<DashboardMatchItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardMatchesApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    }
  );

  return dashboardMatchSchema.parse(
    data,
    zodParseOptions
  ) as DashboardMatchItem;
};

export const deleteDashboardMatch = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardMatchItemApiPath(id), {
    method: "DELETE",
  });
};
