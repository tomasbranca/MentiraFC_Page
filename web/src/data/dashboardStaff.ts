import { getCurrentAccessToken } from "./auth";
import type {
  DashboardStaffDraftMutationInput,
  DashboardStaffItem,
  DashboardStaffMutationInput,
} from "../types/dashboard";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardStaffSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  role: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  slug: z.string(),
  imageAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

const dashboardStaffListSchema = z.array(dashboardStaffSchema);

const DASHBOARD_STAFF_API_PATH = "/api/dashboard/staff";

type DashboardStaffMutationIntent = "draft" | "publish";

const buildDashboardStaffApiPath = (
  id?: string | null,
  intent?: DashboardStaffMutationIntent
): string => {
  const params = new URLSearchParams();

  if (id) {
    params.set("id", id);
  }

  if (intent) {
    params.set("intent", intent);
  }

  const query = params.toString();
  return query ? `${DASHBOARD_STAFF_API_PATH}?${query}` : DASHBOARD_STAFF_API_PATH;
};

export const buildDashboardStaffItemApiPath = (id: string): string =>
  buildDashboardStaffApiPath(id);

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

const buildDashboardStaffFormData = (
  input: DashboardStaffMutationInput | DashboardStaffDraftMutationInput
): FormData => {
  const formData = new FormData();

  formData.set("name", input.name ?? "");
  formData.set("lastName", input.lastName ?? "");
  formData.set("role", input.role ?? "");
  formData.set("birthDate", input.birthDate ?? "");

  if (input.removePhoto) {
    formData.set("removePhoto", "true");
  }

  if (input.photoImage) {
    formData.set("photoImage", input.photoImage, input.photoImage.name);
  }

  return formData;
};

export const fetchDashboardStaff = async (): Promise<DashboardStaffItem[]> => {
  const data = await fetchDashboardApi<unknown[]>(DASHBOARD_STAFF_API_PATH);
  return dashboardStaffListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardStaffItem[];
};

export const fetchDashboardStaffById = async (
  id: string
): Promise<DashboardStaffItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardStaffItemApiPath(id)
  );
  return dashboardStaffSchema.parse(data, zodParseOptions) as DashboardStaffItem;
};

export const publishDashboardStaff = async (
  input: DashboardStaffMutationInput
): Promise<DashboardStaffItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardStaffApiPath(null, "publish"),
    {
      method: "POST",
      body: buildDashboardStaffFormData(input),
    }
  );

  return dashboardStaffSchema.parse(data, zodParseOptions) as DashboardStaffItem;
};

export const publishDashboardStaffById = async (
  id: string,
  input: DashboardStaffMutationInput
): Promise<DashboardStaffItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardStaffApiPath(id, "publish"),
    {
      method: "PUT",
      body: buildDashboardStaffFormData(input),
    }
  );

  return dashboardStaffSchema.parse(data, zodParseOptions) as DashboardStaffItem;
};

export const saveDashboardStaffDraft = async (
  input: DashboardStaffDraftMutationInput,
  id?: string | null
): Promise<DashboardStaffItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardStaffApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: buildDashboardStaffFormData(input),
    }
  );

  return dashboardStaffSchema.parse(data, zodParseOptions) as DashboardStaffItem;
};

export const deleteDashboardStaff = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardStaffItemApiPath(id), {
    method: "DELETE",
  });
};
