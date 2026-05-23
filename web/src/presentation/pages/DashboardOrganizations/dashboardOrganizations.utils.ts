import {
  DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES,
  DASHBOARD_ORGANIZATION_IMAGE_MAX_MEGAPIXELS,
  type DashboardOrganizationDraftMutationInput,
  type DashboardOrganizationInput,
  type DashboardOrganizationMutationInput,
  type DashboardOrganizationReferenceCounts,
} from "../../../types/dashboard";

export const DEFAULT_ORGANIZATION_COLOR = "#7c3aed";

export type DashboardOrganizationErrors = Partial<
  Record<keyof DashboardOrganizationInput, string>
>;

const colorRegex = /^#[0-9a-fA-F]{6}$/;

const normalizeColor = (value: string): string | undefined => {
  const normalizedValue = value.trim().toLowerCase();
  return colorRegex.test(normalizedValue) ? normalizedValue : undefined;
};

export const validateDashboardOrganizationInput = (
  values: DashboardOrganizationInput
): DashboardOrganizationErrors => {
  const errors: DashboardOrganizationErrors = {};

  if (!values.name.trim()) {
    errors.name = "Escribi el nombre del organizador.";
  }

  if (values.primaryColor.trim() && !colorRegex.test(values.primaryColor.trim())) {
    errors.primaryColor = "Carga un color hexadecimal valido.";
  }

  return errors;
};

export const buildDashboardOrganizationMutationInput = (
  values: DashboardOrganizationInput
): DashboardOrganizationMutationInput => ({
  name: values.name.trim(),
  primaryColor: normalizeColor(values.primaryColor),
});

export const buildDashboardOrganizationDraftInput = (
  values: DashboardOrganizationInput
): DashboardOrganizationDraftMutationInput => ({
  name: values.name.trim(),
  primaryColor: normalizeColor(values.primaryColor),
});

export const getOrganizationReferenceCount = (
  referenceCounts: DashboardOrganizationReferenceCounts
): number => referenceCounts.tournaments;

export const getOrganizationColorLabel = (
  primaryColor?: string | null
): string => primaryColor?.trim() || "Sin color";

export const validateDashboardOrganizationImageFile = (
  file?: Pick<File, "size" | "type"> | null
): string | null => {
  if (!file) {
    return null;
  }

  if (
    !DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES.includes(
      file.type as (typeof DASHBOARD_ORGANIZATION_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "El logo debe ser JPG, PNG o WebP.";
  }

  if (file.size > DASHBOARD_ORGANIZATION_IMAGE_MAX_BYTES) {
    return "El logo no puede superar 4 MB en produccion.";
  }

  return null;
};

export const validateDashboardOrganizationImageDimensions = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): string | null => {
  const megapixels = (width * height) / 1_000_000;

  if (megapixels > DASHBOARD_ORGANIZATION_IMAGE_MAX_MEGAPIXELS) {
    return "El logo supera el limite de 256 megapixeles de Sanity.";
  }

  return null;
};

export const readDashboardOrganizationImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(previewUrl);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error("Invalid image file."));
    };
    image.src = previewUrl;
  });
