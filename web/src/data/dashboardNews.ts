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

const DASHBOARD_NEWS_API_PATH = "/api/dashboard/news";

export const buildDashboardNewsItemApiPath = (id: string): string =>
  `${DASHBOARD_NEWS_API_PATH}?id=${encodeURIComponent(id)}`;

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
        error: contentType.includes("text/html")
          ? "La API del dashboard devolvió HTML en vez de JSON. Verificá la ruta de la Function en Vercel."
          : (await response.text()) ||
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
  formData.set("content", JSON.stringify(input.content));

  if (input.useDefaultImage) {
    formData.set("useDefaultImage", "true");
  }

  if (input.coverImage) {
    formData.set("coverImage", input.coverImage, input.coverImage.name);
  }

  Object.entries(input.contentImageFiles ?? {}).forEach(([uploadKey, file]) => {
    formData.set(`contentImage:${uploadKey}`, file, file.name);
  });

  return formData;
};

export const fetchDashboardNews = async (): Promise<DashboardNewsItem[]> => {
  const data = await fetchDashboardApi<unknown[]>(DASHBOARD_NEWS_API_PATH);
  return dashboardNewsListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardNewsItem[];
};

export const fetchDashboardNewsById = async (
  id: string
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardNewsItemApiPath(id)
  );
  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const createDashboardNews = async (
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(DASHBOARD_NEWS_API_PATH, {
    method: "POST",
    body: buildDashboardNewsFormData(input),
  });

  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const updateDashboardNews = async (
  id: string,
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardNewsItemApiPath(id),
    {
      method: "PUT",
      body: buildDashboardNewsFormData(input),
    }
  );

  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const deleteDashboardNews = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardNewsItemApiPath(id), {
    method: "DELETE",
  });
};
