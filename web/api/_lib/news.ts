import { z } from "zod";

import {
  type DashboardNewsInput,
  type DashboardNewsItem,
  type DashboardNewsMutationInput,
} from "../../src/types/dashboard";
import type {
  NewsContentBlock,
  NewsImageContentBlock,
  NewsVideoContentBlock,
} from "../../src/types/models";
import type { PortableTextBlock } from "@portabletext/types";
import {
  DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_NEWS_IMAGE_MAX_BYTES,
} from "./newsImage.js";
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
    "imageAssetId": asset->_id,
    "imageUrl": asset->url,
    "fileUrl": file.asset->url,
    "mimeType": file.asset->mimeType,
    "originalFilename": file.asset->originalFilename
  }
}`;

export const dashboardNewsListQuery = `*[${PUBLISHED_NEWS_FILTER}] | order(date desc) ${dashboardNewsProjection}`;

export const dashboardNewsByIdQuery = `*[${PUBLISHED_NEWS_FILTER} && _id == $id][0] ${dashboardNewsProjection}`;

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

const getFormContent = (formData: FormData): NewsContentBlock[] | null => {
  const rawContent = getFormString(formData, "content");

  try {
    const parsed = JSON.parse(rawContent) as unknown;
    return Array.isArray(parsed) ? (parsed as NewsContentBlock[]) : null;
  } catch {
    return null;
  }
};

const getFormContentImageFiles = (
  formData: FormData
): Record<string, File> => {
  const files: Record<string, File> = {};

  formData.forEach((value, key) => {
    if (!key.startsWith("contentImage:")) {
      return;
    }

    if (value instanceof File && value.size > 0) {
      files[key.slice("contentImage:".length)] = value;
    }
  });

  return files;
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

  const content = getFormContent(formData);

  if (!content) {
    return null;
  }

  return {
    ...input,
    coverImage: getFormImageFile(formData),
    useDefaultImage: getFormBoolean(formData, "useDefaultImage"),
    content,
    contentImageFiles: getFormContentImageFiles(formData),
  };
};

export const parseDashboardNewsRequestInput = async (
  request: Request
): Promise<DashboardNewsMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardNewsFormData(await request.formData());
  }

  const payload = (await request.json()) as {
    content?: unknown;
  };
  const input = parseDashboardNewsInput(payload);

  if (!input || !Array.isArray(payload.content)) {
    return null;
  }

  return {
    ...input,
    content: payload.content as NewsContentBlock[],
  };
};

const adaptDashboardNewsItem = (input: unknown): DashboardNewsItem => {
  return dashboardNewsItemSchema.parse(input) as DashboardNewsItem;
};

const hasMeaningfulContent = (content: NewsContentBlock[]): boolean =>
  content.some((block) => {
    const textBlock = getPortableTextBlock(block);

    if (textBlock) {
      return (textBlock.children ?? []).some(
        (child) => child._type === "span" && child.text.trim().length > 0
      );
    }

    if (isVideoContentBlock(block)) {
      return Boolean(block.url?.trim() || block.fileUrl?.trim());
    }

    return true;
  });

const getContentImageAssetId = (
  block: NewsContentBlock
): string | null => {
  if (!isImageContentBlock(block)) {
    return null;
  }

  if (block.imageAssetId) {
    return block.imageAssetId;
  }

  if (
    block.asset &&
    typeof block.asset === "object" &&
    "_ref" in block.asset &&
    typeof block.asset._ref === "string"
  ) {
    return block.asset._ref;
  }

  return null;
};

const getPortableTextBlock = (
  block: NewsContentBlock
): PortableTextBlock | null =>
  block._type === "block" && "children" in block
    ? (block as PortableTextBlock)
    : null;

const isImageContentBlock = (
  block: NewsContentBlock
): block is NewsImageContentBlock =>
  block._type === "image";

const isVideoContentBlock = (
  block: NewsContentBlock
): block is NewsVideoContentBlock =>
  block._type === "video" && "url" in block;

const collectContentImageAssetIds = (
  content: NewsContentBlock[] = []
): Set<string> =>
  new Set(
    content
      .map(getContentImageAssetId)
      .filter((assetId): assetId is string => Boolean(assetId))
  );

const validateVideoUrl = (url?: string | null): boolean => {
  if (!url?.trim()) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const validatePortableTextLinkHref = (href?: string | null): boolean => {
  if (!href?.trim()) {
    return false;
  }

  if (href.startsWith("#")) {
    return true;
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const hasLegacyVideoFile = (block: NewsVideoContentBlock): boolean =>
  Boolean(
    block.fileUrl ||
      ("file" in block && block.file && typeof block.file === "object")
  );

export const validateDashboardNewsContent = (
  input: DashboardNewsMutationInput
): string | null => {
  if (!hasMeaningfulContent(input.content)) {
    return "Agregá al menos un bloque de contenido antes de guardar.";
  }

  for (const block of input.content) {
    const textBlock = getPortableTextBlock(block);

    if (textBlock) {
      const hasInvalidLink = (textBlock.markDefs ?? []).some(
        (markDef) =>
          markDef._type === "link" &&
          !validatePortableTextLinkHref(
            typeof markDef.href === "string" ? markDef.href : null
          )
      );

      if (hasInvalidLink) {
        return "Cada enlace del contenido necesita una URL segura.";
      }
    }

    if (isImageContentBlock(block)) {
      const imageBlock = block as NewsImageContentBlock & { uploadKey?: string };
      const alt = imageBlock.alt?.trim();

      if (!alt) {
        return "Cada imagen del contenido necesita texto alternativo.";
      }

      if (imageBlock.uploadKey) {
        const imageFile = input.contentImageFiles?.[imageBlock.uploadKey];

        if (!imageFile) {
          return "Falta subir una imagen del contenido.";
        }

        const imageError = validateDashboardNewsImageFile(imageFile);

        if (imageError) {
          return imageError;
        }

        continue;
      }

      if (!getContentImageAssetId(imageBlock)) {
        return "Cada imagen del contenido necesita un archivo.";
      }
    }

    if (isVideoContentBlock(block)) {
      const videoBlock = block;

      if (!hasLegacyVideoFile(videoBlock) && !validateVideoUrl(videoBlock.url)) {
        return "Cada video del contenido necesita una URL válida.";
      }
    }
  }

  return null;
};

const normalizeContentImageBlock = async (
  block: NewsImageContentBlock & {
    uploadKey?: string;
  },
  contentImageFiles: Record<string, File>
): Promise<{ block: NewsImageContentBlock; uploadedAssetId: string | null }> => {
  const alt = block.alt?.trim();

  if (!alt) {
    throw new Error("Every content image requires alt text.");
  }

  if (block.uploadKey) {
    const imageFile = contentImageFiles[block.uploadKey];

    if (!imageFile) {
      throw new Error("A content image upload is missing.");
    }

    const imageError = validateDashboardNewsImageFile(imageFile);

    if (imageError) {
      throw new Error(imageError);
    }

    const uploadedAsset = await uploadSanityImageAsset(imageFile);

    return {
      block: {
        _key: block._key,
        _type: "image",
        asset: {
          _type: "reference",
          _ref: uploadedAsset._id,
        },
        alt,
        caption: block.caption?.trim() || undefined,
      },
      uploadedAssetId: uploadedAsset._id,
    };
  }

  const assetId = getContentImageAssetId(block);

  if (!assetId) {
    throw new Error("Every content image requires an asset.");
  }

  return {
    block: {
      _key: block._key,
      _type: "image",
      asset: {
        _type: "reference",
        _ref: assetId,
      },
      alt,
      caption: block.caption?.trim() || undefined,
    },
    uploadedAssetId: null,
  };
};

const normalizeNewsContent = async (
  input: DashboardNewsMutationInput
): Promise<{ content: NewsContentBlock[]; uploadedAssetIds: string[] }> => {
  if (!hasMeaningfulContent(input.content)) {
    throw new Error("News content cannot be empty.");
  }

  const uploadedAssetIds: string[] = [];
  const normalizedContent: NewsContentBlock[] = [];

  for (const block of input.content) {
    if (isImageContentBlock(block)) {
      const normalized = await normalizeContentImageBlock(
        block as NewsImageContentBlock & { uploadKey?: string },
        input.contentImageFiles ?? {}
      );
      normalizedContent.push(normalized.block);

      if (normalized.uploadedAssetId) {
        uploadedAssetIds.push(normalized.uploadedAssetId);
      }

      continue;
    }

    if (isVideoContentBlock(block)) {
      const videoBlock = block;

      if (hasLegacyVideoFile(videoBlock)) {
        normalizedContent.push(block);
        continue;
      }

      if (!validateVideoUrl(videoBlock.url)) {
        throw new Error("Every content video requires a valid URL.");
      }

      normalizedContent.push({
        _key: videoBlock._key,
        _type: "video",
        url: videoBlock.url?.trim(),
        caption: videoBlock.caption?.trim() || undefined,
      });
      continue;
    }

    normalizedContent.push(block);
  }

  return {
    content: normalizedContent,
    uploadedAssetIds,
  };
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
  const {
    content,
    uploadedAssetIds: uploadedContentAssetIds,
  } = await normalizeNewsContent(input);

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
          content,
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
    await Promise.all(
      uploadedContentAssetIds.map((assetIdToDelete) =>
        safelyDeleteNewsImageAsset(assetIdToDelete)
      )
    );
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
  const {
    content,
    uploadedAssetIds: uploadedContentAssetIds,
  } = await normalizeNewsContent(input);

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
            content,
          },
        },
      },
    ]);
  } catch (error) {
    await safelyDeleteNewsImageAsset(uploadedAssetId);
    await Promise.all(
      uploadedContentAssetIds.map((assetIdToDelete) =>
        safelyDeleteNewsImageAsset(assetIdToDelete)
      )
    );
    throw error;
  }

  const news = await getDashboardNewsById(id);

  if (!news) {
    throw new Error("Updated news item could not be reloaded.");
  }

  if (previousNews?.imageAssetId && previousNews.imageAssetId !== assetId) {
    await safelyDeleteNewsImageAsset(previousNews.imageAssetId);
  }

  const previousContentAssetIds = collectContentImageAssetIds(
    previousNews?.content
  );
  const nextContentAssetIds = collectContentImageAssetIds(content);

  await Promise.all(
    [...previousContentAssetIds]
      .filter((assetIdToDelete) => !nextContentAssetIds.has(assetIdToDelete))
      .map((assetIdToDelete) => safelyDeleteNewsImageAsset(assetIdToDelete))
  );

  return news;
};

export const deleteDashboardNews = async (id: string): Promise<void> => {
  const news = await getDashboardNewsById(id);

  await deleteSanityDocument(id);
  await safelyDeleteNewsImageAsset(news?.imageAssetId);
  await Promise.all(
    [...collectContentImageAssetIds(news?.content)].map((assetIdToDelete) =>
      safelyDeleteNewsImageAsset(assetIdToDelete)
    )
  );
};


