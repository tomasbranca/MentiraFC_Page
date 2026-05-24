import { z } from "zod";

import type {
  DashboardTeamDraftMutationInput,
  DashboardTeamInput,
  DashboardTeamItem,
  DashboardTeamMutationInput,
} from "../../../src/types/dashboard";
import {
  DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_TEAM_IMAGE_MAX_BYTES,
} from "../teamImage.js";

const dashboardTeamInputSchema = z.object({
  name: z.string().trim().min(1),
  isMain: z.boolean(),
});

const dashboardTeamDraftInputSchema = z.object({
  name: z.string().trim().optional(),
  isMain: z.boolean().optional(),
});

const dashboardTeamReferenceCountsSchema = z.object({
  matches: z.number(),
  tournaments: z.number(),
  tables: z.number(),
  snapshots: z.number(),
});

const dashboardTeamItemSchema = z.object({
  id: z.string(),
  publishedId: z.string().nullable().optional(),
  draftId: z.string().nullable().optional(),
  status: z.enum(["published", "draft"]),
  hasDraft: z.boolean(),
  hasPublishedVersion: z.boolean(),
  name: z.string(),
  isMain: z.boolean(),
  updatedAt: z.string().nullable().optional(),
  logoAssetId: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  referenceCounts: dashboardTeamReferenceCountsSchema,
});

const getFormString = (formData: FormData, fieldName: string): string => {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value : "";
};

const getFormBoolean = (formData: FormData, fieldName: string): boolean =>
  getFormString(formData, fieldName) === "true";

const getOptionalFormBoolean = (
  formData: FormData,
  fieldName: string
): boolean | undefined => {
  const value = getFormString(formData, fieldName);

  if (value === "") {
    return undefined;
  }

  return value === "true";
};

const getFormLogoFile = (formData: FormData): File | null => {
  const value = formData.get("logoImage");
  return value instanceof File && value.size > 0 ? value : null;
};

export const validateDashboardTeamImageFile = (
  imageFile?: File | null
): string | null => {
  if (!imageFile) {
    return null;
  }

  if (
    !DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES.includes(
      imageFile.type as (typeof DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "El escudo debe ser JPG, PNG o WebP.";
  }

  if (imageFile.size > DASHBOARD_TEAM_IMAGE_MAX_BYTES) {
    return "El escudo no puede superar 4 MB en produccion.";
  }

  return null;
};

export const parseDashboardTeamInput = (
  input: unknown
): DashboardTeamMutationInput | null => {
  const parsed = dashboardTeamInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};

export const parseDashboardTeamDraftInput = (
  input: unknown
): DashboardTeamDraftMutationInput | null => {
  const parsed = dashboardTeamDraftInputSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  return {
    name: parsed.data.name ?? "",
    isMain: parsed.data.isMain,
  };
};

export const parseDashboardTeamFormData = (
  formData: FormData
): DashboardTeamMutationInput | null => {
  const input = parseDashboardTeamInput({
    name: getFormString(formData, "name"),
    isMain: getFormBoolean(formData, "isMain"),
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

export const parseDashboardTeamDraftFormData = (
  formData: FormData
): DashboardTeamDraftMutationInput | null => {
  const input = parseDashboardTeamDraftInput({
    name: getFormString(formData, "name"),
    isMain: getOptionalFormBoolean(formData, "isMain"),
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

export const parseDashboardTeamRequestInput = async (
  request: Request
): Promise<DashboardTeamMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardTeamFormData(await request.formData());
  }

  return parseDashboardTeamInput((await request.json()) as DashboardTeamInput);
};

export const parseDashboardTeamDraftRequestInput = async (
  request: Request
): Promise<DashboardTeamDraftMutationInput | null> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseDashboardTeamDraftFormData(await request.formData());
  }

  return parseDashboardTeamDraftInput(await request.json());
};

export const adaptDashboardTeamItem = (input: unknown): DashboardTeamItem =>
  dashboardTeamItemSchema.parse(input) as DashboardTeamItem;
