import { getCurrentAccessToken } from "./auth";
import type {
  DashboardTableDraftMutationInput,
  DashboardTableItem,
  DashboardTableMutationInput,
  DashboardTableOptions,
} from "../types/dashboard";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardTableRowSchema = z.object({
  key: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  teamName: z.string().nullable().optional(),
  teamImageUrl: z.string().nullable().optional(),
  wins: z.number().nullable().optional(),
  draws: z.number().nullable().optional(),
  losses: z.number().nullable().optional(),
  goalsFor: z.number().nullable().optional(),
  goalsAgainst: z.number().nullable().optional(),
});

const dashboardTableSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  tournamentId: z.string().nullable().optional(),
  tournamentName: z.string().nullable().optional(),
  tournamentOrganizationName: z.string().nullable().optional(),
  tournamentImageUrl: z.string().nullable().optional(),
  matchdayNumber: z.number().nullable().optional(),
  label: z.string().nullable().optional(),
  snapshotDate: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  rows: z.array(dashboardTableRowSchema),
});

const dashboardTableOptionsSchema = z.object({
  tournaments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      organizationName: z.string().nullable().optional(),
      active: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
      participants: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          isMain: z.boolean().optional(),
          imageUrl: z.string().nullable().optional(),
          status: z.string().nullable().optional(),
          activeFromMatchday: z.number().nullable().optional(),
          activeUntilMatchday: z.number().nullable().optional(),
        })
      ),
    })
  ),
});

const dashboardTableListSchema = z.array(dashboardTableSchema);

const DASHBOARD_TABLE_API_PATH = "/api/dashboard/table";

type DashboardTableMutationIntent = "draft" | "publish";

const buildDashboardTableApiPath = (
  id?: string | null,
  intent?: DashboardTableMutationIntent,
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
  return query ? `${DASHBOARD_TABLE_API_PATH}?${query}` : DASHBOARD_TABLE_API_PATH;
};

export const buildDashboardTableItemApiPath = (id: string): string =>
  buildDashboardTableApiPath(id);

export const buildDashboardTableOptionsApiPath = (): string =>
  buildDashboardTableApiPath(null, undefined, { loadOptions: true });

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

export const fetchDashboardTables = async (): Promise<DashboardTableItem[]> => {
  const data = await fetchDashboardApi<unknown[]>(DASHBOARD_TABLE_API_PATH);
  return dashboardTableListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardTableItem[];
};

export const fetchDashboardTableById = async (
  id: string
): Promise<DashboardTableItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTableItemApiPath(id)
  );
  return dashboardTableSchema.parse(
    data,
    zodParseOptions
  ) as DashboardTableItem;
};

export const fetchDashboardTableOptions =
  async (): Promise<DashboardTableOptions> => {
    const data = await fetchDashboardApi<unknown>(
      buildDashboardTableOptionsApiPath()
    );
    return dashboardTableOptionsSchema.parse(
      data,
      zodParseOptions
    ) as DashboardTableOptions;
  };

export const publishDashboardTable = async (
  input: DashboardTableMutationInput
): Promise<DashboardTableItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTableApiPath(null, "publish"),
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return dashboardTableSchema.parse(data, zodParseOptions) as DashboardTableItem;
};

export const publishDashboardTableById = async (
  id: string,
  input: DashboardTableMutationInput
): Promise<DashboardTableItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTableApiPath(id, "publish"),
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );

  return dashboardTableSchema.parse(data, zodParseOptions) as DashboardTableItem;
};

export const saveDashboardTableDraft = async (
  input: DashboardTableDraftMutationInput,
  id?: string | null
): Promise<DashboardTableItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTableApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    }
  );

  return dashboardTableSchema.parse(data, zodParseOptions) as DashboardTableItem;
};

export const deleteDashboardTable = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardTableItemApiPath(id), {
    method: "DELETE",
  });
};
