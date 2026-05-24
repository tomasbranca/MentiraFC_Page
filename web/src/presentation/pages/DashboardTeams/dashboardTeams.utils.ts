import {
  DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_TEAM_IMAGE_MAX_BYTES,
  DASHBOARD_TEAM_IMAGE_MAX_MEGAPIXELS,
  type DashboardTeamDraftMutationInput,
  type DashboardTeamInput,
  type DashboardTeamMutationInput,
  type DashboardTeamReferenceCounts,
} from "../../../types/dashboard";

export type DashboardTeamErrors = Partial<Record<keyof DashboardTeamInput, string>>;

export const validateDashboardTeamInput = (
  values: DashboardTeamInput
): DashboardTeamErrors => {
  const errors: DashboardTeamErrors = {};

  if (!values.name.trim()) {
    errors.name = "Escribi el nombre del club.";
  }

  return errors;
};

export const buildDashboardTeamMutationInput = (
  values: DashboardTeamInput
): DashboardTeamMutationInput => ({
  name: values.name.trim(),
  isMain: values.isMain,
});

export const buildDashboardTeamDraftInput = (
  values: DashboardTeamInput
): DashboardTeamDraftMutationInput => ({
  name: values.name.trim(),
  isMain: values.isMain,
});

export const getTeamReferenceCount = (
  referenceCounts: DashboardTeamReferenceCounts
): number =>
  referenceCounts.matches +
  referenceCounts.tournaments +
  referenceCounts.tables +
  referenceCounts.snapshots;

export const getTeamUsageLabel = (
  referenceCounts: DashboardTeamReferenceCounts
): string => {
  const parts = [
    referenceCounts.matches ? `${referenceCounts.matches} partidos` : null,
    referenceCounts.tournaments ? `${referenceCounts.tournaments} torneos` : null,
    referenceCounts.tables ? `${referenceCounts.tables} tablas` : null,
    referenceCounts.snapshots ? `${referenceCounts.snapshots} snapshots` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" - ") : "Sin usos";
};

export const validateDashboardTeamImageFile = (
  file?: Pick<File, "size" | "type"> | null
): string | null => {
  if (!file) {
    return null;
  }

  if (
    !DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES.includes(
      file.type as (typeof DASHBOARD_TEAM_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "El escudo debe ser JPG, PNG o WebP.";
  }

  if (file.size > DASHBOARD_TEAM_IMAGE_MAX_BYTES) {
    return "El escudo no puede superar 4 MB en produccion.";
  }

  return null;
};

export const validateDashboardTeamImageDimensions = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): string | null => {
  const megapixels = (width * height) / 1_000_000;

  if (megapixels > DASHBOARD_TEAM_IMAGE_MAX_MEGAPIXELS) {
    return "El escudo supera el limite de 256 megapixeles de Sanity.";
  }

  return null;
};

export const readDashboardTeamImageDimensions = (
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
