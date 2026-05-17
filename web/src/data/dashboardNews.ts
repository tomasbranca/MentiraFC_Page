import { getSupabaseClient } from "../utils/supabase";
import type {
  DashboardNewsItem,
  DashboardNewsMutationInput,
} from "../types/dashboard";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardNewsSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  slug: z.string(),
  imageAlt: z.string().nullable().optional(),
  imageAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  content: z.array(z.unknown()).optional(),
});

const dashboardNewsListSchema = z.array(dashboardNewsSchema);

const getAccessToken = async (): Promise<string> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Missing auth session.");
  }

  return session.access_token;
};

const fetchDashboardApi = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const accessToken = await getAccessToken();
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
        error:
          (await response.text()) ||
          `Dashboard request failed with status ${response.status}.`,
      };

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Dashboard request failed.");
  }

  return payload.data as T;
};

const buildDashboardNewsFormData = (
  input: DashboardNewsMutationInput
): FormData => {
  const formData = new FormData();

  formData.set("title", input.title);
  formData.set("description", input.description);
  formData.set("date", input.date);
  formData.set("slug", input.slug);
  formData.set("imageAlt", input.imageAlt);

  if (input.useDefaultImage) {
    formData.set("useDefaultImage", "true");
  }

  if (input.coverImage) {
    formData.set("coverImage", input.coverImage, input.coverImage.name);
  }

  return formData;
};

export const fetchDashboardNews = async (): Promise<DashboardNewsItem[]> => {
  const data = await fetchDashboardApi<unknown[]>("/api/dashboard/news");
  return dashboardNewsListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardNewsItem[];
};

export const fetchDashboardNewsById = async (
  id: string
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(`/api/dashboard/news/${id}`);
  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const createDashboardNews = async (
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>("/api/dashboard/news", {
    method: "POST",
    body: buildDashboardNewsFormData(input),
  });

  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const updateDashboardNews = async (
  id: string,
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(`/api/dashboard/news/${id}`, {
    method: "PUT",
    body: buildDashboardNewsFormData(input),
  });

  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const deleteDashboardNews = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(`/api/dashboard/news/${id}`, {
    method: "DELETE",
  });
};
