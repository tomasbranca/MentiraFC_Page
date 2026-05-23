import {
  DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_STAFF_IMAGE_MAX_BYTES,
  DASHBOARD_STAFF_IMAGE_MAX_MEGAPIXELS,
  type DashboardStaffDraftMutationInput,
  type DashboardStaffInput,
  type DashboardStaffMutationInput,
} from "../../../types/dashboard";

export type DashboardStaffErrors = Partial<
  Record<keyof DashboardStaffInput, string>
>;

export const validateDashboardStaffInput = (
  values: DashboardStaffInput
): DashboardStaffErrors => {
  const errors: DashboardStaffErrors = {};

  if (!values.name.trim()) {
    errors.name = "Escribi el nombre.";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Escribi el apellido.";
  }

  if (!values.role.trim()) {
    errors.role = "Escribi el rol.";
  }

  return errors;
};

export const buildDashboardStaffMutationInput = (
  values: DashboardStaffInput
): DashboardStaffMutationInput => ({
  name: values.name.trim(),
  lastName: values.lastName.trim(),
  role: values.role.trim(),
  birthDate: values.birthDate.trim() || undefined,
});

export const buildDashboardStaffDraftInput = (
  values: DashboardStaffInput
): DashboardStaffDraftMutationInput => ({
  name: values.name.trim(),
  lastName: values.lastName.trim(),
  role: values.role.trim(),
  birthDate: values.birthDate.trim() || undefined,
});

export const getDashboardStaffRoleLabel = (role?: string | null): string =>
  role?.trim() || "Sin rol";

export const validateDashboardStaffImageFile = (
  file?: Pick<File, "size" | "type"> | null
): string | null => {
  if (!file) {
    return null;
  }

  if (
    !DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES.includes(
      file.type as (typeof DASHBOARD_STAFF_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "La foto debe ser JPG, PNG o WebP.";
  }

  if (file.size > DASHBOARD_STAFF_IMAGE_MAX_BYTES) {
    return "La foto no puede superar 4 MB en produccion.";
  }

  return null;
};

export const validateDashboardStaffImageDimensions = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): string | null => {
  const megapixels = (width * height) / 1_000_000;

  if (megapixels > DASHBOARD_STAFF_IMAGE_MAX_MEGAPIXELS) {
    return "La foto supera el limite de 256 megapixeles de Sanity.";
  }

  return null;
};

export const readDashboardStaffImageDimensions = (
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
