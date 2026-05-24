import { getCurrentAccessToken } from "./auth";
import type {
  DashboardTeamDraftMutationInput,
  DashboardTeamItem,
  DashboardTeamMutationInput,
} from "../types/dashboard";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardTeamReferenceCountsSchema = z.object({
  matches: z.number(),
  tournaments: z.number(),
  tables: z.number(),
  snapshots: z.number(),
});

const dashboardTeamSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  isMain: z.boolean(),
  updatedAt: z.string().nullable().optional(),
  logoAssetId: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  referenceCounts: dashboardTeamReferenceCountsSchema,
});

const dashboardTeamListSchema = z.array(dashboardTeamSchema);

const DASHBOARD_TEAMS_API_PATH = "/api/dashboard/teams";

type DashboardTeamMutationIntent = "draft" | "publish";

const buildDashboardTeamsApiPath = (
  id?: string | null,
  intent?: DashboardTeamMutationIntent
): string => {
  const params = new URLSearchParams();

  if (id) {
    params.set("id", id);
  }

  if (intent) {
    params.set("intent", intent);
  }

  const query = params.toString();
  return query ? `${DASHBOARD_TEAMS_API_PATH}?${query}` : DASHBOARD_TEAMS_API_PATH;
};

export const buildDashboardTeamItemApiPath = (id: string): string =>
  buildDashboardTeamsApiPath(id);

const fetchDashboardApi = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const accessToken = await getCurrentAccessToken();
  const headers = new Headers(init?.headers);

  headers.set("Authorization", `Bearer ${accessToken}`);

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
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

const buildDashboardTeamFormData = (
  input: DashboardTeamMutationInput | DashboardTeamDraftMutationInput
): FormData => {
  const formData = new FormData();

  formData.set("name", input.name ?? "");

  if (typeof input.isMain === "boolean") {
    formData.set("isMain", String(input.isMain));
  }

  if (input.removeLogo) {
    formData.set("removeLogo", "true");
  }

  if (input.logoImage) {
    formData.set("logoImage", input.logoImage, input.logoImage.name);
  }

  return formData;
};

export const fetchDashboardTeams = async (): Promise<DashboardTeamItem[]> => {
  const data = await fetchDashboardApi<unknown[]>(DASHBOARD_TEAMS_API_PATH);
  return dashboardTeamListSchema.parse(data, zodParseOptions) as DashboardTeamItem[];
};

export const fetchDashboardTeamById = async (
  id: string
): Promise<DashboardTeamItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTeamItemApiPath(id)
  );
  return dashboardTeamSchema.parse(data, zodParseOptions) as DashboardTeamItem;
};

export const publishDashboardTeam = async (
  input: DashboardTeamMutationInput
): Promise<DashboardTeamItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTeamsApiPath(null, "publish"),
    {
      method: "POST",
      body: buildDashboardTeamFormData(input),
    }
  );

  return dashboardTeamSchema.parse(data, zodParseOptions) as DashboardTeamItem;
};

export const publishDashboardTeamById = async (
  id: string,
  input: DashboardTeamMutationInput
): Promise<DashboardTeamItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTeamsApiPath(id, "publish"),
    {
      method: "PUT",
      body: buildDashboardTeamFormData(input),
    }
  );

  return dashboardTeamSchema.parse(data, zodParseOptions) as DashboardTeamItem;
};

export const saveDashboardTeamDraft = async (
  input: DashboardTeamDraftMutationInput,
  id?: string | null
): Promise<DashboardTeamItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardTeamsApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: buildDashboardTeamFormData(input),
    }
  );

  return dashboardTeamSchema.parse(data, zodParseOptions) as DashboardTeamItem;
};

export const deleteDashboardTeam = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardTeamItemApiPath(id), {
    method: "DELETE",
  });
};
