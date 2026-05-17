import { z } from "zod";

import {
  DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_NEWS_IMAGE_MAX_BYTES,
  type DashboardNewsInput,
  type DashboardNewsItem,
  type DashboardNewsMutationInput,
} from "../../src/types/dashboard";
import {
  deleteSanityDocument,
  mutateSanity,
  querySanity,
  uploadSanityImageAsset,
} from "./sanity.js";

const DEFAULT_NEWS_IMAGE_ASSET_ID =
  "image-1edafb056eb32eef08e521cabc7b50470d48f74b-809x809-webp";

const dashboardNewsInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.string().datetime(),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  imageAlt: z.string().trim().optional(),
});

const dashboardNewsItemSchema = z.object({
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

const PUBLISHED_NEWS_FILTER = `_type == "news" && !(_id in path("drafts.**"))`;

const dashboardNewsProjection = `{
  "id": _id,
  title,
  description,
  date,
  "slug": slug.current,
  "imageAlt": image.alt,
  "imageAssetId": image.asset->_id,
  "imageUrl": image.asset->url,
  content[]{
    ...,
    "imageUrl": asset->url,
    "fileUrl": file.asset->url,
    "mimeType": file.asset->mimeType,
    "originalFilename": file.asset->originalFilename
  }
}`;

export const dashboardNewsListQuery = `*[${PUBLISHED_NEWS_FILTER}] | order(date desc) ${dashboardNewsProjection}`;

export const dashboardNewsByIdQuery = `*[${PUBLISHED_NEWS_FILTER} && _id == $id][0] ${dashboardNewsProjection}`;

const defaultContent = (title: string) => [
  {
    _key: "intro",
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [
      {
        _key: "intro-text",
        _type: "span",
        marks: [],
        text: `Texto de ejemplo para "${title}". Reemplazá este contenido desde el editor avanzado cuando esté disponible.`,
      },
    ],
  },
];

const normalizeImageAlt = ({ title, imageAlt }: DashboardNewsInput): string => {
  const normalizedImageAlt = imageAlt.trim();
  return normalizedImageAlt || title.trim();
};

const buildNewsImageValue = (assetId: string, alt: string) => ({
  _type: "image",
  asset: {
    _type: "reference",
    _ref: assetId,
  },
  alt,
});

const isDefaultNewsImageAsset = (assetId?: string | null): boolean =>
  assetId === DEFAULT_NEWS_IMAGE_ASSET_ID;

const safelyDeleteNewsImageAsset = async (
  assetId?: string | null
): Promise<void> => {
  if (!assetId || isDefaultNewsImageAsset(assetId)) {
    return;
  }

  try {
    await deleteSanityDocument(assetId);
  } catch {
    // Asset cleanup should never make an already-saved news mutation fail.
    // Sanity may reject deletion if another document still references the asset.
  }
};

const getFormString = (formData: FormData, fieldName: string): string => {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
};

const getFormBoolean = (formData: FormData, fieldName: string): boolean =>
  getFormString(formData, fieldName) === "true";

const getFormImageFile = (formData: FormData): File | null => {
  const value = formData.get("coverImage");
  return value instanceof File && value.size > 0 ? value : null;
};

export const validateDashboardNewsImageFile = (
  imageFile?: File | null
): string | null => {
  if (!imageFile) {
    return null;
  }

  if (
    !DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES.includes(
      imageFile.type as (typeof DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "La imagen debe ser JPG, PNG o WebP.";
  }

  if (imageFile.size > DASHBOARD_NEWS_IMAGE_MAX_BYTES) {
    return "La imagen no puede superar 4 MB en producción.";
  }

  return null;
};

export const parseDashboardNewsInput = (
  input: unknown
): DashboardNewsInput | null => {
  const parsed = dashboardNewsInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const imageAlt = parsed.data.imageAlt?.trim() || parsed.data.title.trim();

  return {
    ...parsed.data,
    imageAlt,
  };
};

export const parseDashboardNewsFormData = (
  formData: FormData
): DashboardNewsMutationInput | null => {
  const input = parseDashboardNewsInput({
    title: getFormString(formData, "title"),
    description: getFormString(formData, "description"),
    date: getFormString(formData, "date"),
    slug: getFormString(formData, "slug"),
    imageAlt: getFormString(formData, "imageAlt"),
  });

  if (!input) {
    return null;
  }

  return {
    ...input,
    coverImage: getFormImageFile(formData),
    useDefaultImage: getFormBoolean(formData, "useDefaultImage"),
  };
};

export const parseDashboardNewsRequestInput = async (
  request: Request
): Promise<DashboardNewsMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardNewsFormData(await request.formData());
  }

  return parseDashboardNewsInput(await request.json());
};

const adaptDashboardNewsItem = (input: unknown): DashboardNewsItem => {
  return dashboardNewsItemSchema.parse(input) as DashboardNewsItem;
};

export const listDashboardNews = async (): Promise<DashboardNewsItem[]> => {
  const result = await querySanity<unknown[]>(dashboardNewsListQuery);

  return result.map(adaptDashboardNewsItem);
};

export const getDashboardNewsById = async (
  id: string
): Promise<DashboardNewsItem | null> => {
  const result = await querySanity<unknown | null>(
    dashboardNewsByIdQuery,
    { id }
  );

  return result ? adaptDashboardNewsItem(result) : null;
};

const resolveNextImageAssetId = async (
  input: DashboardNewsMutationInput,
  previousImageAssetId?: string | null
): Promise<{ assetId: string; uploadedAssetId: string | null }> => {
  if (input.coverImage) {
    const uploadedAsset = await uploadSanityImageAsset(input.coverImage);

    return {
      assetId: uploadedAsset._id,
      uploadedAssetId: uploadedAsset._id,
    };
  }

  if (input.useDefaultImage) {
    return {
      assetId: DEFAULT_NEWS_IMAGE_ASSET_ID,
      uploadedAssetId: null,
    };
  }

  return {
    assetId: previousImageAssetId || DEFAULT_NEWS_IMAGE_ASSET_ID,
    uploadedAssetId: null,
  };
};

export const createDashboardNews = async (
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const { assetId, uploadedAssetId } = await resolveNextImageAssetId(input);

  try {
    const created = await mutateSanity<unknown>([
      {
        create: {
          _type: "news",
          title: input.title,
          description: input.description,
          date: input.date,
          slug: {
            _type: "slug",
            current: input.slug,
          },
          image: buildNewsImageValue(assetId, normalizeImageAlt(input)),
          content: defaultContent(input.title),
        },
      },
    ]);

    if (!created || typeof created !== "object" || !("_id" in created)) {
      throw new Error("Sanity did not return the created news item.");
    }

    const news = await getDashboardNewsById(String(created._id));

    if (!news) {
      throw new Error("Created news item could not be reloaded.");
    }

    return news;
  } catch (error) {
    await safelyDeleteNewsImageAsset(uploadedAssetId);
    throw error;
  }
};

export const updateDashboardNews = async (
  id: string,
  input: DashboardNewsMutationInput
): Promise<DashboardNewsItem> => {
  const previousNews = await getDashboardNewsById(id);
  const { assetId, uploadedAssetId } = await resolveNextImageAssetId(
    input,
    previousNews?.imageAssetId
  );

  try {
    await mutateSanity<unknown>([
      {
        patch: {
          id,
          set: {
            title: input.title,
            description: input.description,
            date: input.date,
            slug: {
              _type: "slug",
              current: input.slug,
            },
            image: buildNewsImageValue(assetId, normalizeImageAlt(input)),
          },
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteNewsImageAsset(uploadedAssetId);
    throw error;
  }

  const news = await getDashboardNewsById(id);

  if (!news) {
    throw new Error("Updated news item could not be reloaded.");
  }

  if (previousNews?.imageAssetId && previousNews.imageAssetId !== assetId) {
    await safelyDeleteNewsImageAsset(previousNews.imageAssetId);
  }

  return news;
};

export const deleteDashboardNews = async (id: string): Promise<void> => {
  const news = await getDashboardNewsById(id);

  await deleteSanityDocument(id);
  await safelyDeleteNewsImageAsset(news?.imageAssetId);
};
