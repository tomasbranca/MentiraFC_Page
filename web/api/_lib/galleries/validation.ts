import { z } from "zod";

import type {
  DashboardGalleryDraftMutationInput,
  DashboardGalleryItem,
  DashboardGalleryMutationInput,
  DashboardGalleryOptions,
  DashboardGalleryPhotoMutationInput,
} from "../../../src/types/dashboard";
import {
  DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_GALLERY_IMAGE_MAX_BYTES,
} from "../galleryImage.js";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const dashboardGalleryPhotoInputSchema = z.object({
  key: z.string().trim().optional(),
  imageAssetId: z.string().trim().optional(),
  uploadKey: z.string().trim().optional(),
  alt: z.string().trim().min(1),
  caption: z.string().trim().optional(),
  isHero: z.boolean(),
});

const dashboardGalleryDraftPhotoInputSchema = z.object({
  key: z.string().trim().optional(),
  imageAssetId: z.string().trim().optional(),
  uploadKey: z.string().trim().optional(),
  alt: z.string().trim().optional(),
  caption: z.string().trim().optional(),
  isHero: z.boolean().optional(),
});

const dashboardGalleryInputSchema = z
  .object({
    gameId: z.string().trim().min(1),
    slug: slugSchema,
    photos: z.array(dashboardGalleryPhotoInputSchema).min(1),
  })
  .superRefine((input, context) => {
    const heroCount = input.photos.filter((photo) => photo.isHero).length;

    if (heroCount !== 1) {
      context.addIssue({
        code: "custom",
        path: ["photos"],
        message: "Published galleries need exactly one hero photo.",
      });
    }

    input.photos.forEach((photo, index) => {
      if (!photo.imageAssetId && !photo.uploadKey) {
        context.addIssue({
          code: "custom",
          path: ["photos", index, "image"],
          message: "Photo image is required.",
        });
      }
    });
  });

const dashboardGalleryDraftInputSchema = z.object({
  gameId: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  photos: z.array(dashboardGalleryDraftPhotoInputSchema).optional(),
});

const dashboardGalleryPhotoItemSchema = z.object({
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

const dashboardGalleryItemSchema = z.object({
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
  photos: z.array(dashboardGalleryPhotoItemSchema),
  photoCount: z.number(),
});

const dashboardGalleryOptionsSchema = z.object({
  games: z.array(dashboardGalleryGameOptionSchema),
});

const getFormString = (formData: FormData, fieldName: string): string => {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
};

const parsePhotos = (
  value: unknown
): DashboardGalleryPhotoMutationInput[] | null => {
  if (Array.isArray(value)) {
    return value as DashboardGalleryPhotoMutationInput[];
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? (parsed as DashboardGalleryPhotoMutationInput[])
      : null;
  } catch {
    return null;
  }
};

const getFormPhotoImageFiles = (formData: FormData): Record<string, File> => {
  const files: Record<string, File> = {};

  formData.forEach((value, key) => {
    if (!key.startsWith("photoImage:")) {
      return;
    }

    if (value instanceof File && value.size > 0) {
      files[key.slice("photoImage:".length)] = value;
    }
  });

  return files;
};

export const validateDashboardGalleryImageFile = (
  imageFile?: File | null
): string | null => {
  if (!imageFile) {
    return null;
  }

  if (
    !DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES.includes(
      imageFile.type as (typeof DASHBOARD_GALLERY_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "La foto debe ser JPG, PNG o WebP.";
  }

  if (imageFile.size > DASHBOARD_GALLERY_IMAGE_MAX_BYTES) {
    return "La foto no puede superar 4 MB en produccion.";
  }

  return null;
};

export const parseDashboardGalleryInput = (
  input: unknown
): DashboardGalleryMutationInput | null => {
  const parsed = dashboardGalleryInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};

export const parseDashboardGalleryDraftInput = (
  input: unknown
): DashboardGalleryDraftMutationInput | null => {
  const parsed = dashboardGalleryDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return {
    gameId: parsed.data.gameId ?? "",
    slug: parsed.data.slug ?? "",
    photos: parsed.data.photos ?? [],
  };
};

export const parseDashboardGalleryFormData = (
  formData: FormData
): DashboardGalleryMutationInput | null => {
  const photos = parsePhotos(getFormString(formData, "photos"));
  const input = parseDashboardGalleryInput({
    gameId: getFormString(formData, "gameId"),
    slug: getFormString(formData, "slug"),
    photos,
  });

  if (!input) {
    return null;
  }

  return {
    ...input,
    photoImageFiles: getFormPhotoImageFiles(formData),
  };
};

export const parseDashboardGalleryDraftFormData = (
  formData: FormData
): DashboardGalleryDraftMutationInput | null => {
  const photos = parsePhotos(getFormString(formData, "photos"));
  const input = parseDashboardGalleryDraftInput({
    gameId: getFormString(formData, "gameId"),
    slug: getFormString(formData, "slug"),
    photos: photos ?? [],
  });

  if (!input) {
    return null;
  }

  return {
    ...input,
    photoImageFiles: getFormPhotoImageFiles(formData),
  };
};

export const parseDashboardGalleryRequestInput = async (
  request: Request
): Promise<DashboardGalleryMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardGalleryFormData(await request.formData());
  }

  const payload = (await request.json()) as {
    photos?: unknown;
  };
  const input = parseDashboardGalleryInput({
    ...payload,
    photos: parsePhotos(payload.photos),
  });

  return input;
};

export const parseDashboardGalleryDraftRequestInput = async (
  request: Request
): Promise<DashboardGalleryDraftMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardGalleryDraftFormData(await request.formData());
  }

  const payload = (await request.json()) as {
    photos?: unknown;
  };
  const input = parseDashboardGalleryDraftInput({
    ...payload,
    photos: parsePhotos(payload.photos) ?? [],
  });

  return input;
};

export const adaptDashboardGalleryItem = (
  input: unknown
): DashboardGalleryItem =>
  dashboardGalleryItemSchema.parse(input) as DashboardGalleryItem;

export const adaptDashboardGalleryOptions = (
  input: unknown
): DashboardGalleryOptions =>
  dashboardGalleryOptionsSchema.parse(input) as DashboardGalleryOptions;
