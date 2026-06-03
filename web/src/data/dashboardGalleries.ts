import { getCurrentAccessToken } from "./auth";
import type {
  DashboardGalleryDraftMutationInput,
  DashboardGalleryItem,
  DashboardGalleryMutationInput,
  DashboardGalleryOptions,
  DashboardGalleryPhotoInput,
  DashboardGalleryPhotoMutationInput,
} from "../types/dashboard";
import type { PaginatedResult, SortDirection } from "../../shared/pagination";
import { z, zodParseOptions } from "./zodRuntime";

const dashboardGalleryPhotoSchema = z.object({
  key: z.string().nullable().optional(),
  imageAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  alt: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  isHero: z.boolean().optional(),
  originalFilename: z.string().nullable().optional(),
  dimensions: z
    .object({
      width: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
      aspectRatio: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const dashboardGalleryGameOptionSchema = z.object({
  id: z.string(),
  date: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  competition: z.string().nullable().optional(),
  tournamentId: z.string().nullable().optional(),
  tournamentName: z.string().nullable().optional(),
  tournamentOrganizationName: z.string().nullable().optional(),
  rivalId: z.string().nullable().optional(),
  rivalName: z.string().nullable().optional(),
  rivalImageUrl: z.string().nullable().optional(),
  goalsFor: z.number().nullable().optional(),
  goalsAgainst: z.number().nullable().optional(),
});

const dashboardGallerySchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  slug: z.string(),
  updatedAt: z.string().nullable().optional(),
  gameId: z.string().nullable().optional(),
  gameDate: z.string().nullable().optional(),
  gameState: z.string().nullable().optional(),
  gameLocation: z.string().nullable().optional(),
  gameCompetition: z.string().nullable().optional(),
  gameTournamentId: z.string().nullable().optional(),
  gameTournamentName: z.string().nullable().optional(),
  gameTournamentOrganizationName: z.string().nullable().optional(),
  rivalId: z.string().nullable().optional(),
  rivalName: z.string().nullable().optional(),
  rivalImageUrl: z.string().nullable().optional(),
  goalsFor: z.number().nullable().optional(),
  goalsAgainst: z.number().nullable().optional(),
  photos: z.array(dashboardGalleryPhotoSchema),
  photoCount: z.number(),
});

const dashboardGalleryListSchema = z.array(dashboardGallerySchema);
const dashboardGalleryPageSchema = z.object({
  items: z.array(dashboardGallerySchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number(),
  totalPages: z.number().optional(),
  hasNextPage: z.boolean().optional(),
  hasPreviousPage: z.boolean().optional(),
  nextCursor: z.string().nullable().optional(),
  previousCursor: z.string().nullable().optional(),
});

const dashboardGalleryOptionsSchema = z.object({
  games: z.array(dashboardGalleryGameOptionSchema),
});

const DASHBOARD_GALLERIES_API_PATH = "/api/dashboard/galleries";

type DashboardGalleryMutationIntent = "draft" | "publish";
export type DashboardGalleriesPageSortBy = "date" | "updatedAt" | "slug";
export type DashboardGalleriesPageStatusFilter =
  | "all"
  | "published"
  | "draft";
export type DashboardGalleriesPagePhotoFilter =
  | "all"
  | "with_photos"
  | "empty";

export type DashboardGalleriesPageOptions = {
  page?: number;
  limit?: number;
  sortBy?: DashboardGalleriesPageSortBy;
  direction?: SortDirection;
  search?: string | null;
  status?: DashboardGalleriesPageStatusFilter;
  photos?: DashboardGalleriesPagePhotoFilter;
};

type DashboardGalleriesApiOptions = DashboardGalleriesPageOptions & {
  loadOptions?: boolean;
};

const buildDashboardGalleriesApiPath = (
  id?: string | null,
  intent?: DashboardGalleryMutationIntent,
  options?: DashboardGalleriesApiOptions
): string => {
  const params = new URLSearchParams();
  const { loadOptions, ...pageOptions } = options ?? {};

  if (id) {
    params.set("id", id);
  }

  if (intent) {
    params.set("intent", intent);
  }

  if (loadOptions) {
    params.set("options", "1");
  }

  Object.entries(pageOptions).forEach(([key, value]) => {
    if (value != null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query
    ? `${DASHBOARD_GALLERIES_API_PATH}?${query}`
    : DASHBOARD_GALLERIES_API_PATH;
};

export const buildDashboardGalleryItemApiPath = (id: string): string =>
  buildDashboardGalleriesApiPath(id);

export const buildDashboardGalleryOptionsApiPath = (): string =>
  buildDashboardGalleriesApiPath(null, undefined, { loadOptions: true });

export const buildDashboardGalleriesPageApiPath = (
  options: DashboardGalleriesPageOptions = {}
): string => buildDashboardGalleriesApiPath(null, undefined, options);

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

const buildPhotoMutationInput = (
  photo: DashboardGalleryPhotoInput
): DashboardGalleryPhotoMutationInput => ({
  key: photo.key,
  imageAssetId: photo.imageAssetId || undefined,
  uploadKey: photo.uploadKey || undefined,
  alt: photo.alt,
  caption: photo.caption,
  isHero: photo.isHero,
});

const buildDashboardGalleryFormData = (
  input: DashboardGalleryMutationInput | DashboardGalleryDraftMutationInput
): FormData => {
  const formData = new FormData();

  formData.set("gameId", input.gameId ?? "");
  formData.set("slug", input.slug ?? "");
  formData.set("photos", JSON.stringify(input.photos ?? []));

  Object.entries(input.photoImageFiles ?? {}).forEach(([uploadKey, file]) => {
    formData.set(`photoImage:${uploadKey}`, file, file.name);
  });

  return formData;
};

export const buildDashboardGalleryMutationInput = (
  values: {
    gameId: string;
    slug: string;
    photos: DashboardGalleryPhotoInput[];
  }
): DashboardGalleryMutationInput => ({
  gameId: values.gameId,
  slug: values.slug,
  photos: values.photos.map(buildPhotoMutationInput),
  photoImageFiles: Object.fromEntries(
    values.photos
      .filter((photo) => photo.file && photo.uploadKey)
      .map((photo) => [photo.uploadKey, photo.file as File])
  ),
});

export const buildDashboardGalleryDraftMutationInput = (
  values: {
    gameId: string;
    slug: string;
    photos: DashboardGalleryPhotoInput[];
  }
): DashboardGalleryDraftMutationInput => buildDashboardGalleryMutationInput(values);

export const fetchDashboardGalleries = async (): Promise<
  DashboardGalleryItem[]
> => {
  const data = await fetchDashboardApi<unknown[]>(DASHBOARD_GALLERIES_API_PATH);
  return dashboardGalleryListSchema.parse(
    data,
    zodParseOptions
  ) as DashboardGalleryItem[];
};

export const fetchDashboardGalleriesPage = async (
  options: DashboardGalleriesPageOptions = {}
): Promise<PaginatedResult<DashboardGalleryItem>> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardGalleriesPageApiPath(options)
  );

  return dashboardGalleryPageSchema.parse(
    data,
    zodParseOptions
  ) as PaginatedResult<DashboardGalleryItem>;
};

export const fetchDashboardGalleryById = async (
  id: string
): Promise<DashboardGalleryItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardGalleryItemApiPath(id)
  );
  return dashboardGallerySchema.parse(
    data,
    zodParseOptions
  ) as DashboardGalleryItem;
};

export const fetchDashboardGalleryOptions =
  async (): Promise<DashboardGalleryOptions> => {
    const data = await fetchDashboardApi<unknown>(
      buildDashboardGalleryOptionsApiPath()
    );
    return dashboardGalleryOptionsSchema.parse(
      data,
      zodParseOptions
    ) as DashboardGalleryOptions;
  };

export const publishDashboardGallery = async (
  input: DashboardGalleryMutationInput
): Promise<DashboardGalleryItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardGalleriesApiPath(null, "publish"),
    {
      method: "POST",
      body: buildDashboardGalleryFormData(input),
    }
  );

  return dashboardGallerySchema.parse(
    data,
    zodParseOptions
  ) as DashboardGalleryItem;
};

export const publishDashboardGalleryById = async (
  id: string,
  input: DashboardGalleryMutationInput
): Promise<DashboardGalleryItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardGalleriesApiPath(id, "publish"),
    {
      method: "PUT",
      body: buildDashboardGalleryFormData(input),
    }
  );

  return dashboardGallerySchema.parse(
    data,
    zodParseOptions
  ) as DashboardGalleryItem;
};

export const saveDashboardGalleryDraft = async (
  input: DashboardGalleryDraftMutationInput,
  id?: string | null
): Promise<DashboardGalleryItem> => {
  const data = await fetchDashboardApi<unknown>(
    buildDashboardGalleriesApiPath(id, "draft"),
    {
      method: id ? "PUT" : "POST",
      body: buildDashboardGalleryFormData(input),
    }
  );

  return dashboardGallerySchema.parse(
    data,
    zodParseOptions
  ) as DashboardGalleryItem;
};

export const deleteDashboardGallery = async (id: string): Promise<void> => {
  await fetchDashboardApi<null>(buildDashboardGalleryItemApiPath(id), {
    method: "DELETE",
  });
};
