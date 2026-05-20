import { z } from "zod";

import {
  type DashboardNewsDraftMutationInput,
  type DashboardNewsInput,
  type DashboardNewsItem,
  type DashboardNewsMutationInput,
} from "../../../src/types/dashboard";
import type { NewsContentBlock } from "../../../src/types/models";
import {
  DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_NEWS_IMAGE_MAX_BYTES,
} from "../newsImage.js";

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

const dashboardNewsDraftInputSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  date: z
    .string()
    .trim()
    .refine((value) => !value || !Number.isNaN(new Date(value).getTime()))
    .optional(),
  slug: z.string().trim().optional(),
  imageAlt: z.string().trim().optional(),
});

const dashboardNewsItemSchema = z.object({
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

export const parseDashboardNewsDraftInput = (
  input: unknown
): DashboardNewsDraftMutationInput | null => {
  const parsed = dashboardNewsDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return {
    title: parsed.data.title ?? "",
    description: parsed.data.description ?? "",
    date: parsed.data.date ?? "",
    slug: parsed.data.slug ?? "",
    imageAlt: parsed.data.imageAlt ?? "",
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

export const parseDashboardNewsDraftFormData = (
  formData: FormData
): DashboardNewsDraftMutationInput | null => {
  const input = parseDashboardNewsDraftInput({
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
    content: getFormContent(formData) ?? [],
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

export const parseDashboardNewsDraftRequestInput = async (
  request: Request
): Promise<DashboardNewsDraftMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardNewsDraftFormData(await request.formData());
  }

  const payload = (await request.json()) as {
    content?: unknown;
  };
  const input = parseDashboardNewsDraftInput(payload);

  if (!input) {
    return null;
  }

  return {
    ...input,
    content: Array.isArray(payload.content)
      ? (payload.content as NewsContentBlock[])
      : [],
  };
};

export const adaptDashboardNewsItem = (input: unknown): DashboardNewsItem =>
  dashboardNewsItemSchema.parse(input) as DashboardNewsItem;
