import { getCurrentAccessToken } from "./auth";
import type {
  DashboardNewsDraftMutationInput,
  DashboardNewsItem,
  DashboardNewsMutationInput,
} from "../types/dashboard";
import type { PaginatedResult, SortDirection } from "../../shared/pagination";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardNewsSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  title: z.string(),
  description: z.string(),
  date: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  slug: z.string(),
  imageAlt: z.string().nullable().optional(),
  imageAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  content: z.array(z.unknown()).optional(),
});

const dashboardNewsListSchema = z.array(dashboardNewsSchema);
const dashboardNewsPageSchema = z.object({
  items: z.array(dashboardNewsSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number(),
  totalPages: z.number().optional(),
  hasNextPage: z.boolean().optional(),
  hasPreviousPage: z.boolean().optional(),
  nextCursor: z.string().nullable().optional(),
  previousCursor: z.string().nullable().optional(),
});

const DASHBOARD_NEWS_API_PATH = "/api/dashboard/news";

type DashboardNewsMutationIntent = "draft" | "publish";
export type DashboardNewsPageSortBy = "date" | "title" | "updatedAt";
export type DashboardNewsPageStatusFilter = "all" | "published" | "draft";

export type DashboardNewsPageOptions = {
  page?: number;
  limit?: number;
  sortBy?: DashboardNewsPageSortBy;
  direction?: SortDirection;
  search?: string | null;
  status?: DashboardNewsPageStatusFilter;
};

const buildDashboardNewsApiPath = (
  id?: string | null,
  intent?: DashboardNewsMutationIntent,
  options?: DashboardNewsPageOptions
): string => {
  const params = new URLSearchParams();

  if (id) {
    params.set("id", id);
  }

  if (intent) {
    params.set("intent", intent);
  }

  Object.entries(options ?? {}).forEach(([key, value]) => {
    if (value != null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `${DASHBOARD_NEWS_API_PATH}?${query}` : DASHBOARD_NEWS_API_PATH;
};

export const buildDashboardNewsItemApiPath = (id: string): string =>
  buildDashboardNewsApiPath(id);

export const buildDashboardNewsPageApiPath = (
  options: DashboardNewsPageOptions = {}
): string => buildDashboardNewsApiPath(null, undefined, options);

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
  input: DashboardNewsMutationInput | DashboardNewsDraftMutationInput
): FormData => {
  const formData = new FormData();

  formData.set("title", input.title ?? "");
  formData.set("description", input.description ?? "");
  formData.set("date", input.date ?? "");
  formData.set("slug", input.slug ?? "");
  formData.set("imageAlt", input.imageAlt ?? "");
  formData.set("content", JSON.stringify(input.content ?? []));

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

export const fetchDashboardNewsPage = async (
  options: DashboardNewsPageOptions = {}
): Promise<PaginatedResult<DashboardNewsItem>> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardNewsPageApiPath(options)
  );

  return dashboardNewsPageSchema.parse(
    data,
    zodParseOptions
  ) as PaginatedResult<DashboardNewsItem>;
};

export const fetchDashboardNewsById = async (
  id: string
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardNewsItemApiPath(id)
  );
  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const publishDashboardNews = async (
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardNewsApiPath(null, "publish"),
    {
      method: "POST",
      body: buildDashboardNewsFormData(input),
    }
  );

  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const publishDashboardNewsById = async (
  id: string,
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardNewsApiPath(id, "publish"),
    {
      method: "PUT",
      body: buildDashboardNewsFormData(input),
    }
  );

  return dashboardNewsSchema.parse(data, zodParseOptions) as DashboardNewsItem;
};

export const saveDashboardNewsDraft = async (
  input: DashboardNewsDraftMutationInput,
  id?: string | null
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardNewsApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: buildDashboardNewsFormData(input),
    }
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
