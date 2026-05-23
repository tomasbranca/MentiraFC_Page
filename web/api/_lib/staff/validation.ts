import { z } from "zod";

import type {
  DashboardStaffDraftMutationInput,
  DashboardStaffInput,
  DashboardStaffItem,
  DashboardStaffMutationInput,
} from "../../../src/types/dashboard";
import {
  DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_STAFF_IMAGE_MAX_BYTES,
} from "../staffImage.js";

const optionalBirthDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
);

const dashboardStaffInputSchema = z.object({
  name: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  role: z.string().trim().min(1),
  birthDate: optionalBirthDateSchema,
});

const dashboardStaffDraftInputSchema = z.object({
  name: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  role: z.string().trim().optional(),
  birthDate: optionalBirthDateSchema,
});

const dashboardStaffItemSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  role: z.string().nullable().optional(),
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

export const validateDashboardStaffImageFile = (
  imageFile?: File | null
): string | null => {
  if (!imageFile) {
    return null;
  }

  if (
    !DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES.includes(
      imageFile.type as (typeof DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "La foto debe ser JPG, PNG o WebP.";
  }

  if (imageFile.size > DASHBOARD_STAFF_IMAGE_MAX_BYTES) {
    return "La foto no puede superar 4 MB en produccion.";
  }

  return null;
};

export const parseDashboardStaffInput = (
  input: unknown
): DashboardStaffMutationInput | null => {
  const parsed = dashboardStaffInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const data = parsed.data;

  return {
    name: data.name,
    lastName: data.lastName,
    role: data.role,
    birthDate: data.birthDate,
  };
};

export const parseDashboardStaffDraftInput = (
  input: unknown
): DashboardStaffDraftMutationInput | null => {
  const parsed = dashboardStaffDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const data = parsed.data;

  return {
    name: data.name ?? "",
    lastName: data.lastName ?? "",
    role: data.role ?? "",
    birthDate: data.birthDate,
  };
};

export const parseDashboardStaffFormData = (
  formData: FormData
): DashboardStaffMutationInput | null => {
  const input = parseDashboardStaffInput({
    name: getFormString(formData, "name"),
    lastName: getFormString(formData, "lastName"),
    role: getFormString(formData, "role"),
    birthDate: getFormString(formData, "birthDate"),
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

export const parseDashboardStaffDraftFormData = (
  formData: FormData
): DashboardStaffDraftMutationInput | null => {
  const input = parseDashboardStaffDraftInput({
    name: getFormString(formData, "name"),
    lastName: getFormString(formData, "lastName"),
    role: getFormString(formData, "role"),
    birthDate: getFormString(formData, "birthDate"),
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

export const parseDashboardStaffRequestInput = async (
  request: Request
): Promise<DashboardStaffMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardStaffFormData(await request.formData());
  }

  return parseDashboardStaffInput((await request.json()) as DashboardStaffInput);
};

export const parseDashboardStaffDraftRequestInput = async (
  request: Request
): Promise<DashboardStaffDraftMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardStaffDraftFormData(await request.formData());
  }

  return parseDashboardStaffDraftInput(await request.json());
};

export const adaptDashboardStaffItem = (input: unknown): DashboardStaffItem =>
  dashboardStaffItemSchema.parse(input) as DashboardStaffItem;
