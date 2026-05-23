import { z } from "zod";

import type {
  DashboardOrganizationDraftMutationInput,
  DashboardOrganizationInput,
  DashboardOrganizationItem,
  DashboardOrganizationMutationInput,
} from "../../../src/types/dashboard";
import {
  DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES,
} from "../organizationImage.js";

const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .optional()
  .transform((value) => value?.toLowerCase());

const optionalColorSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  colorSchema
);

const dashboardOrganizationInputSchema = z.object({
  name: z.string().trim().min(1),
  primaryColor: optionalColorSchema,
});

const dashboardOrganizationDraftInputSchema = z.object({
  name: z.string().trim().optional(),
  primaryColor: optionalColorSchema,
});

const dashboardOrganizationReferenceCountsSchema = z.object({
  tournaments: z.number(),
});

const dashboardOrganizationItemSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  primaryColor: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  logoAssetId: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  referenceCounts: dashboardOrganizationReferenceCountsSchema,
});

const getFormString = (formData: FormData, fieldName: string): string => {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
};

const getFormBoolean = (formData: FormData, fieldName: string): boolean =>
  getFormString(formData, fieldName) === "true";

const getFormLogoFile = (formData: FormData): File | null => {
  const value = formData.get("logoImage");
  return value instanceof File && value.size > 0 ? value : null;
};

export const validateDashboardOrganizationImageFile = (
  imageFile?: File | null
): string | null => {
  if (!imageFile) {
    return null;
  }

  if (
    !DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES.includes(
      imageFile.type as (typeof DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "El logo debe ser JPG, PNG o WebP.";
  }

  if (imageFile.size > DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES) {
    return "El logo no puede superar 4 MB en produccion.";
  }

  return null;
};

export const parseDashboardOrganizationInput = (
  input: unknown
): DashboardOrganizationMutationInput | null => {
  const parsed = dashboardOrganizationInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};

export const parseDashboardOrganizationDraftInput = (
  input: unknown
): DashboardOrganizationDraftMutationInput | null => {
  const parsed = dashboardOrganizationDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return {
    name: parsed.data.name ?? "",
    primaryColor: parsed.data.primaryColor,
  };
};

export const parseDashboardOrganizationFormData = (
  formData: FormData
): DashboardOrganizationMutationInput | null => {
  const input = parseDashboardOrganizationInput({
    name: getFormString(formData, "name"),
    primaryColor: getFormString(formData, "primaryColor"),
  });

  if (!input) {
    return null;
  }

  return {
    ...input,
    logoImage: getFormLogoFile(formData),
    removeLogo: getFormBoolean(formData, "removeLogo"),
  };
};

export const parseDashboardOrganizationDraftFormData = (
  formData: FormData
): DashboardOrganizationDraftMutationInput | null => {
  const input = parseDashboardOrganizationDraftInput({
    name: getFormString(formData, "name"),
    primaryColor: getFormString(formData, "primaryColor"),
  });

  if (!input) {
    return null;
  }

  return {
    ...input,
    logoImage: getFormLogoFile(formData),
    removeLogo: getFormBoolean(formData, "removeLogo"),
  };
};

export const parseDashboardOrganizationRequestInput = async (
  request: Request
): Promise<DashboardOrganizationMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardOrganizationFormData(await request.formData());
  }

  return parseDashboardOrganizationInput(
    (await request.json()) as DashboardOrganizationInput
  );
};

export const parseDashboardOrganizationDraftRequestInput = async (
  request: Request
): Promise<DashboardOrganizationDraftMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardOrganizationDraftFormData(await request.formData());
  }

  return parseDashboardOrganizationDraftInput(await request.json());
};

export const adaptDashboardOrganizationItem = (
  input: unknown
): DashboardOrganizationItem =>
  dashboardOrganizationItemSchema.parse(input) as DashboardOrganizationItem;
