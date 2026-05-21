import { getCurrentAccessToken } from "./auth";
import type {
  DashboardMatchDraftMutationInput,
  DashboardMatchItem,
  DashboardMatchMutationInput,
  DashboardMatchOptions,
} from "../types/dashboard";
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
  state: z.string().nullable().optional(),
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

const DASHBOARD_MATCHES_API_PATH = "/api/dashboard/matches";

type DashboardMatchMutationIntent = "draft" | "publish";

const buildDashboardMatchesApiPath = (
  id?: string | null,
  intent?: DashboardMatchMutationIntent,
  options?: { loadOptions?: boolean }
): string => {
  const params = new URLSearchParams();

  if (id) {
    params.set("id", id);
  }

  if (intent) {
    params.set("intent", intent);
  }

  if (options?.loadOptions) {
    params.set("options", "1");
  }

  const query = params.toString();
  return query
    ? `${DASHBOARD_MATCHES_API_PATH}?${query}`
    : DASHBOARD_MATCHES_API_PATH;
};

export const buildDashboardMatchItemApiPath = (id: string): string =>
  buildDashboardMatchesApiPath(id);

export const buildDashboardMatchOptionsApiPath = (): string =>
  buildDashboardMatchesApiPath(null, undefined, { loadOptions: true });

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
