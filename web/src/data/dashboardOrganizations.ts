import { getCurrentAccessToken } from "./auth";
import type {
  DashboardOrganizationDraftMutationInput,
  DashboardOrganizationItem,
  DashboardOrganizationMutationInput,
} from "../types/dashboard";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardOrganizationReferenceCountsSchema = z.object({
  tournaments: z.number(),
});

const dashboardOrganizationSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  primaryColor: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  logoAssetId: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  referenceCounts: dashboardOrganizationReferenceCountsSchema,
});

const dashboardOrganizationListSchema = z.array(dashboardOrganizationSchema);

const DASHBOARD_ORGANIZATIONS_API_PATH = "/api/dashboard/organizations";

type DashboardOrganizationMutationIntent = "draft" | "publish";

const buildDashboardOrganizationsApiPath = (
  id?: string | null,
  intent?: DashboardOrganizationMutationIntent
): string => {
  const params = new URLSearchParams();

  if (id) {
    params.set("id", id);
  }

  if (intent) {
    params.set("intent", intent);
  }

  const query = params.toString();
  return query
    ? `${DASHBOARD_ORGANIZATIONS_API_PATH}?${query}`
    : DASHBOARD_ORGANIZATIONS_API_PATH;
};

export const buildDashboardOrganizationItemApiPath = (id: string): string =>
  buildDashboardOrganizationsApiPath(id);

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

const buildDashboardOrganizationFormData = (
  input:
    | DashboardOrganizationMutationInput
    | DashboardOrganizationDraftMutationInput
): FormData => {
  const formData = new FormData();

  formData.set("name", input.name ?? "");
  formData.set("primaryColor", input.primaryColor ?? "");

  if (input.removeLogo) {
    formData.set("removeLogo", "true");
  }

  if (input.logoImage) {
    formData.set("logoImage", input.logoImage, input.logoImage.name);
  }

  return formData;
};

export const fetchDashboardOrganizations = async (): Promise<
  DashboardOrganizationItem[]
> => {
  const data = await fetchDashboardApi<unknown[]>(
    DASHBOARD_ORGANIZATIONS_API_PATH
  );
  return dashboardOrganizationListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardOrganizationItem[];
};

export const fetchDashboardOrganizationById = async (
  id: string
): Promise<DashboardOrganizationItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardOrganizationItemApiPath(id)
  );
  return dashboardOrganizationSchema.parse(
    data,
    zodParseOptions
  ) as DashboardOrganizationItem;
};

export const publishDashboardOrganization = async (
  input: DashboardOrganizationMutationInput
): Promise<DashboardOrganizationItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardOrganizationsApiPath(null, "publish"),
    {
      method: "POST",
      body: buildDashboardOrganizationFormData(input),
    }
  );

  return dashboardOrganizationSchema.parse(
    data,
    zodParseOptions
  ) as DashboardOrganizationItem;
};

export const publishDashboardOrganizationById = async (
  id: string,
  input: DashboardOrganizationMutationInput
): Promise<DashboardOrganizationItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardOrganizationsApiPath(id, "publish"),
    {
      method: "PUT",
      body: buildDashboardOrganizationFormData(input),
    }
  );

  return dashboardOrganizationSchema.parse(
    data,
    zodParseOptions
  ) as DashboardOrganizationItem;
};

export const saveDashboardOrganizationDraft = async (
  input: DashboardOrganizationDraftMutationInput,
  id?: string | null
): Promise<DashboardOrganizationItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardOrganizationsApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: buildDashboardOrganizationFormData(input),
    }
  );

  return dashboardOrganizationSchema.parse(
    data,
    zodParseOptions
  ) as DashboardOrganizationItem;
};

export const deleteDashboardOrganization = async (
  id: string
): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardOrganizationItemApiPath(id), {
    method: "DELETE",
  });
};
