import { z } from "zod";

import type {
  DashboardPlayerDraftMutationInput,
  DashboardPlayerInput,
  DashboardPlayerItem,
  DashboardPlayerMutationInput,
  DashboardPlayerPosition,
} from "../../../src/types/dashboard";
import {
  DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_PLAYER_IMAGE_MAX_BYTES,
} from "../playerImage.js";

const dashboardPlayerPositionValues = ["arq", "def", "med", "del"] as const;
const dashboardPlayerDominantFootValues = ["left", "right"] as const;
const dashboardPlayerPositionSchema = z.enum(dashboardPlayerPositionValues);
const dashboardPlayerDominantFootSchema = z.enum(
  dashboardPlayerDominantFootValues
);
const ratingSchema = z.coerce.number().int().min(1).max(10);
const optionalRatingSchema = ratingSchema.optional();
const optionalNumberSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(0).optional()
);
const optionalBirthDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
);

const dashboardPlayerFieldRatingsSchema = z.object({
  speed: optionalRatingSchema,
  shooting: optionalRatingSchema,
  passing: optionalRatingSchema,
  dribbling: optionalRatingSchema,
  defense: optionalRatingSchema,
  physical: optionalRatingSchema,
});

const dashboardPlayerGoalkeeperRatingsSchema = z.object({
  jumping: optionalRatingSchema,
  saving: optionalRatingSchema,
  kicking: optionalRatingSchema,
  reflexes: optionalRatingSchema,
  speed: optionalRatingSchema,
  positioning: optionalRatingSchema,
});

const dashboardPlayerInputSchema = z.object({
  name: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  number: z.coerce.number().int().min(0),
  position: dashboardPlayerPositionSchema,
  dominantFoot: dashboardPlayerDominantFootSchema.optional(),
  birthDate: optionalBirthDateSchema,
  fieldRatings: dashboardPlayerFieldRatingsSchema.optional(),
  goalkeeperRatings: dashboardPlayerGoalkeeperRatingsSchema.optional(),
});

const dashboardPlayerDraftInputSchema = z.object({
  name: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  number: optionalNumberSchema,
  position: z.union([dashboardPlayerPositionSchema, z.literal("")]).optional(),
  dominantFoot: z
    .union([dashboardPlayerDominantFootSchema, z.literal("")])
    .optional(),
  birthDate: optionalBirthDateSchema,
  fieldRatings: dashboardPlayerFieldRatingsSchema.optional(),
  goalkeeperRatings: dashboardPlayerGoalkeeperRatingsSchema.optional(),
});

const dashboardPlayerItemRatingSchema = z.number().nullable().optional();
const dashboardPlayerItemFieldRatingsSchema = z
  .object({
    speed: dashboardPlayerItemRatingSchema,
    shooting: dashboardPlayerItemRatingSchema,
    passing: dashboardPlayerItemRatingSchema,
    dribbling: dashboardPlayerItemRatingSchema,
    defense: dashboardPlayerItemRatingSchema,
    physical: dashboardPlayerItemRatingSchema,
  })
  .optional();
const dashboardPlayerItemGoalkeeperRatingsSchema = z
  .object({
    jumping: dashboardPlayerItemRatingSchema,
    saving: dashboardPlayerItemRatingSchema,
    kicking: dashboardPlayerItemRatingSchema,
    reflexes: dashboardPlayerItemRatingSchema,
    speed: dashboardPlayerItemRatingSchema,
    positioning: dashboardPlayerItemRatingSchema,
  })
  .optional();

const dashboardPlayerItemSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  isActive: z.boolean(),
  canManageActiveStatus: z.boolean(),
  name: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  number: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
  dominantFoot: dashboardPlayerDominantFootSchema.nullable().optional(),
  fieldRatings: dashboardPlayerItemFieldRatingsSchema,
  goalkeeperRatings: dashboardPlayerItemGoalkeeperRatingsSchema,
  birthDate: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  slug: z.string(),
  imageAssetId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

const getFormString = (formData: FormData, fieldName: string): string => {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
};

const getFormBoolean = (formData: FormData, fieldName: string): boolean =>
  getFormString(formData, fieldName) === "true";

const getFormPhotoFile = (formData: FormData): File | null => {
  const value = formData.get("photoImage");
  return value instanceof File && value.size > 0 ? value : null;
};

const getFormRatings = (formData: FormData, fieldName: string): unknown => {
  const rawValue = getFormString(formData, fieldName);

  if (!rawValue) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const removeEmptyRatingFields = <
  T extends Record<string, number | undefined> | undefined,
>(
  ratings: T
): T | undefined => {
  if (!ratings) {
    return undefined;
  }

  const compactRatings = Object.fromEntries(
    Object.entries(ratings).filter(([, value]) => typeof value === "number")
  );

  return Object.keys(compactRatings).length > 0 ? (compactRatings as T) : undefined;
};

const isDashboardPlayerPosition = (
  value?: string
): value is DashboardPlayerPosition =>
  dashboardPlayerPositionValues.includes(value as DashboardPlayerPosition);

const isDashboardPlayerDominantFoot = (
  value?: string
): value is DashboardPlayerMutationInput["dominantFoot"] =>
  dashboardPlayerDominantFootValues.includes(
    value as (typeof dashboardPlayerDominantFootValues)[number]
  );

export const validateDashboardPlayerImageFile = (
  imageFile?: File | null
): string | null => {
  if (!imageFile) {
    return null;
  }

  if (
    !DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES.includes(
      imageFile.type as (typeof DASHBOARD_PLAYER_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "La foto debe ser JPG, PNG o WebP.";
  }

  if (imageFile.size > DASHBOARD_PLAYER_IMAGE_MAX_BYTES) {
    return "La foto no puede superar 4 MB en produccion.";
  }

  return null;
};

export const parseDashboardPlayerInput = (
  input: unknown
): DashboardPlayerMutationInput | null => {
  const parsed = dashboardPlayerInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const data = parsed.data;

  return {
    name: data.name,
    lastName: data.lastName,
    number: data.number,
    position: data.position,
    dominantFoot: data.dominantFoot,
    birthDate: data.birthDate,
    fieldRatings: removeEmptyRatingFields(data.fieldRatings),
    goalkeeperRatings: removeEmptyRatingFields(data.goalkeeperRatings),
  };
};

export const parseDashboardPlayerDraftInput = (
  input: unknown
): DashboardPlayerDraftMutationInput | null => {
  const parsed = dashboardPlayerDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const data = parsed.data;

  return {
    name: data.name ?? "",
    lastName: data.lastName ?? "",
    number: data.number,
    position: isDashboardPlayerPosition(data.position)
      ? data.position
      : undefined,
    dominantFoot: isDashboardPlayerDominantFoot(data.dominantFoot)
      ? data.dominantFoot
      : undefined,
    birthDate: data.birthDate,
    fieldRatings: removeEmptyRatingFields(data.fieldRatings),
    goalkeeperRatings: removeEmptyRatingFields(data.goalkeeperRatings),
  };
};

export const parseDashboardPlayerFormData = (
  formData: FormData
): DashboardPlayerMutationInput | null => {
  const input = parseDashboardPlayerInput({
    name: getFormString(formData, "name"),
    lastName: getFormString(formData, "lastName"),
    number: getFormString(formData, "number"),
    position: getFormString(formData, "position"),
    dominantFoot: getFormString(formData, "dominantFoot") || undefined,
    birthDate: getFormString(formData, "birthDate"),
    fieldRatings: getFormRatings(formData, "fieldRatings"),
    goalkeeperRatings: getFormRatings(formData, "goalkeeperRatings"),
  });

  if (!input) {
    return null;
  }

  return {
    ...input,
    photoImage: getFormPhotoFile(formData),
    removePhoto: getFormBoolean(formData, "removePhoto"),
  };
};

export const parseDashboardPlayerDraftFormData = (
  formData: FormData
): DashboardPlayerDraftMutationInput | null => {
  const input = parseDashboardPlayerDraftInput({
    name: getFormString(formData, "name"),
    lastName: getFormString(formData, "lastName"),
    number: getFormString(formData, "number"),
    position: getFormString(formData, "position"),
    dominantFoot: getFormString(formData, "dominantFoot"),
    birthDate: getFormString(formData, "birthDate"),
    fieldRatings: getFormRatings(formData, "fieldRatings"),
    goalkeeperRatings: getFormRatings(formData, "goalkeeperRatings"),
  });

  if (!input) {
    return null;
  }

  return {
    ...input,
    photoImage: getFormPhotoFile(formData),
    removePhoto: getFormBoolean(formData, "removePhoto"),
  };
};

export const parseDashboardPlayerRequestInput = async (
  request: Request
): Promise<DashboardPlayerMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardPlayerFormData(await request.formData());
  }

  return parseDashboardPlayerInput((await request.json()) as DashboardPlayerInput);
};

export const parseDashboardPlayerDraftRequestInput = async (
  request: Request
): Promise<DashboardPlayerDraftMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardPlayerDraftFormData(await request.formData());
  }

  return parseDashboardPlayerDraftInput(await request.json());
};

export const parseDashboardPlayerActiveStatusInput = (
  input: unknown
): boolean | null => {
  const parsed = z
    .object({
      isActive: z.boolean(),
    })
    .safeParse(input);

  return parsed.success ? parsed.data.isActive : null;
};

export const adaptDashboardPlayerItem = (input: unknown): DashboardPlayerItem =>
  dashboardPlayerItemSchema.parse(input) as DashboardPlayerItem;
