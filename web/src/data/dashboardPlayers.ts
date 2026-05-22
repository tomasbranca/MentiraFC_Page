import { getCurrentAccessToken } from "./auth";
import type {
  DashboardPlayerDraftMutationInput,
  DashboardPlayerItem,
  DashboardPlayerMutationInput,
} from "../types/dashboard";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardPlayerRatingSchema = z
  .object({
    speed: z.number().nullable().optional(),
    shooting: z.number().nullable().optional(),
    passing: z.number().nullable().optional(),
    dribbling: z.number().nullable().optional(),
    defense: z.number().nullable().optional(),
    physical: z.number().nullable().optional(),
    jumping: z.number().nullable().optional(),
    saving: z.number().nullable().optional(),
    kicking: z.number().nullable().optional(),
    reflexes: z.number().nullable().optional(),
    positioning: z.number().nullable().optional(),
  })
  .partial();

const dashboardPlayerSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  number: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
  dominantFoot: z.enum(["left", "right"]).nullable().optional(),
  fieldRatings: dashboardPlayerRatingSchema.optional(),
  goalkeeperRatings: dashboardPlayerRatingSchema.optional(),
  birthDate: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  slug: z.string(),
  imageAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

const dashboardPlayerListSchema = z.array(dashboardPlayerSchema);

const DASHBOARD_PLAYERS_API_PATH = "/api/dashboard/players";

type DashboardPlayerMutationIntent = "draft" | "publish";

const buildDashboardPlayersApiPath = (
  id?: string | null,
  intent?: DashboardPlayerMutationIntent
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
    ? `${DASHBOARD_PLAYERS_API_PATH}?${query}`
    : DASHBOARD_PLAYERS_API_PATH;
};

export const buildDashboardPlayerItemApiPath = (id: string): string =>
  buildDashboardPlayersApiPath(id);

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

const buildDashboardPlayerFormData = (
  input: DashboardPlayerMutationInput | DashboardPlayerDraftMutationInput
): FormData => {
  const formData = new FormData();

  formData.set("name", input.name ?? "");
  formData.set("lastName", input.lastName ?? "");
  formData.set("number", input.number == null ? "" : String(input.number));
  formData.set("position", input.position ?? "");
  formData.set("dominantFoot", input.dominantFoot ?? "");
  formData.set("birthDate", input.birthDate ?? "");
  formData.set("fieldRatings", JSON.stringify(input.fieldRatings ?? {}));
  formData.set(
    "goalkeeperRatings",
    JSON.stringify(input.goalkeeperRatings ?? {})
  );

  if (input.removePhoto) {
    formData.set("removePhoto", "true");
  }

  if (input.photoImage) {
    formData.set("photoImage", input.photoImage, input.photoImage.name);
  }

  return formData;
};

export const fetchDashboardPlayers = async (): Promise<
  DashboardPlayerItem[]
> => {
  const data = await fetchDashboardApi<unknown[]>(DASHBOARD_PLAYERS_API_PATH);
  return dashboardPlayerListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardPlayerItem[];
};

export const fetchDashboardPlayerById = async (
  id: string
): Promise<DashboardPlayerItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardPlayerItemApiPath(id)
  );
  return dashboardPlayerSchema.parse(
    data,
    zodParseOptions
  ) as DashboardPlayerItem;
};

export const publishDashboardPlayer = async (
  input: DashboardPlayerMutationInput
): Promise<DashboardPlayerItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardPlayersApiPath(null, "publish"),
    {
      method: "POST",
      body: buildDashboardPlayerFormData(input),
    }
  );

  return dashboardPlayerSchema.parse(
    data,
    zodParseOptions
  ) as DashboardPlayerItem;
};

export const publishDashboardPlayerById = async (
  id: string,
  input: DashboardPlayerMutationInput
): Promise<DashboardPlayerItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardPlayersApiPath(id, "publish"),
    {
      method: "PUT",
      body: buildDashboardPlayerFormData(input),
    }
  );

  return dashboardPlayerSchema.parse(
    data,
    zodParseOptions
  ) as DashboardPlayerItem;
};

export const saveDashboardPlayerDraft = async (
  input: DashboardPlayerDraftMutationInput,
  id?: string | null
): Promise<DashboardPlayerItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardPlayersApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: buildDashboardPlayerFormData(input),
    }
  );

  return dashboardPlayerSchema.parse(
    data,
    zodParseOptions
  ) as DashboardPlayerItem;
};

export const deleteDashboardPlayer = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardPlayerItemApiPath(id), {
    method: "DELETE",
  });
};
