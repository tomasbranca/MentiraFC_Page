import { getCurrentAccessToken } from "./auth";
import type {
  DashboardTournamentDraftMutationInput,
  DashboardTournamentItem,
  DashboardTournamentMutationInput,
  DashboardTournamentOptions,
} from "../types/dashboard";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardTournamentParticipantSchema = z.object({
  key: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  teamName: z.string().nullable().optional(),
  teamImageUrl: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  activeFromMatchday: z.number().nullable().optional(),
  activeUntilMatchday: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const dashboardTournamentReferenceCountsSchema = z.object({
  matches: z.number(),
  tables: z.number(),
  snapshots: z.number(),
});

const dashboardTournamentSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  organizationId: z.string().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  organizationImageUrl: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
  primaryPrizeSlots: z.number().nullable().optional(),
  secondaryPrizeSlots: z.number().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  participants: z.array(dashboardTournamentParticipantSchema),
  referenceCounts: dashboardTournamentReferenceCountsSchema,
});

const dashboardTournamentOptionsSchema = z.object({
  organizations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      imageUrl: z.string().nullable().optional(),
    })
  ),
  teams: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      isMain: z.boolean().optional(),
      imageUrl: z.string().nullable().optional(),
    })
  ),
});

const dashboardTournamentListSchema = z.array(dashboardTournamentSchema);

const DASHBOARD_TOURNAMENTS_API_PATH = "/api/dashboard/tournaments";

type DashboardTournamentMutationIntent = "draft" | "publish";

const buildDashboardTournamentsApiPath = (
  id?: string | null,
  intent?: DashboardTournamentMutationIntent,
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
    ? `${DASHBOARD_TOURNAMENTS_API_PATH}?${query}`
    : DASHBOARD_TOURNAMENTS_API_PATH;
};

export const buildDashboardTournamentItemApiPath = (id: string): string =>
  buildDashboardTournamentsApiPath(id);

export const buildDashboardTournamentOptionsApiPath = (): string =>
  buildDashboardTournamentsApiPath(null, undefined, { loadOptions: true });

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

export const fetchDashboardTournaments = async (): Promise<
  DashboardTournamentItem[]
> => {
  const data = await fetchDashboardApi<unknown[]>(DASHBOARD_TOURNAMENTS_API_PATH);
  return dashboardTournamentListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardTournamentItem[];
};

export const fetchDashboardTournamentById = async (
  id: string
): Promise<DashboardTournamentItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTournamentItemApiPath(id)
  );
  return dashboardTournamentSchema.parse(
    data,
    zodParseOptions
  ) as DashboardTournamentItem;
};

export const fetchDashboardTournamentOptions =
  async (): Promise<DashboardTournamentOptions> => {
    const data = await fetchDashboardApi<unknown>(
      buildDashboardTournamentOptionsApiPath()
    );
    return dashboardTournamentOptionsSchema.parse(
      data,
      zodParseOptions
    ) as DashboardTournamentOptions;
  };

export const publishDashboardTournament = async (
  input: DashboardTournamentMutationInput
): Promise<DashboardTournamentItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTournamentsApiPath(null, "publish"),
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return dashboardTournamentSchema.parse(
    data,
    zodParseOptions
  ) as DashboardTournamentItem;
};

export const publishDashboardTournamentById = async (
  id: string,
  input: DashboardTournamentMutationInput
): Promise<DashboardTournamentItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTournamentsApiPath(id, "publish"),
    {
      method: "PUT",
      body: JSON.stringify(input),
    }
  );

  return dashboardTournamentSchema.parse(
    data,
    zodParseOptions
  ) as DashboardTournamentItem;
};

export const saveDashboardTournamentDraft = async (
  input: DashboardTournamentDraftMutationInput,
  id?: string | null
): Promise<DashboardTournamentItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTournamentsApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    }
  );

  return dashboardTournamentSchema.parse(
    data,
    zodParseOptions
  ) as DashboardTournamentItem;
};

export const deleteDashboardTournament = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardTournamentItemApiPath(id), {
    method: "DELETE",
  });
};
