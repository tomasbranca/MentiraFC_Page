import { z } from "zod";

import { getSupabaseClient } from "../utils/supabase";
import type { DashboardNewsInput, DashboardNewsItem } from "../types/dashboard";

const dashboardNewsSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  slug: z.string(),
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
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as {
    data?: T;
    error?: string;
  };

  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Dashboard request failed.");
  }

  return payload.data as T;
};

export const fetchDashboardNews = async (): Promise<DashboardNewsItem[]> => {
  const data = await fetchDashboardApi<unknown[]>("/api/dashboard/news");
  return dashboardNewsListSchema.parse(data) as DashboardNewsItem[];
};

export const fetchDashboardNewsById = async (
  id: string
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(`/api/dashboard/news/${id}`);
  return dashboardNewsSchema.parse(data) as DashboardNewsItem;
};

export const createDashboardNews = async (
  input: DashboardNewsInput
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>("/api/dashboard/news", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return dashboardNewsSchema.parse(data) as DashboardNewsItem;
};

export const updateDashboardNews = async (
  id: string,
  input: DashboardNewsInput
): Promise<DashboardNewsItem> => {
  const data = await fetchDashboardApi<unknown>(`/api/dashboard/news/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  return dashboardNewsSchema.parse(data) as DashboardNewsItem;
};

export const deleteDashboardNews = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(`/api/dashboard/news/${id}`, {
    method: "DELETE",
  });
};
