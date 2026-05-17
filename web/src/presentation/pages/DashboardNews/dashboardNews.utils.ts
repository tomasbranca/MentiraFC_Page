import {
  DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES,
  DASHBOARD_NEWS_IMAGE_MAX_BYTES,
  DASHBOARD_NEWS_IMAGE_MAX_MEGAPIXELS,
  type DashboardNewsInput,
} from "../../../types/dashboard";

export type DashboardNewsErrors = Partial<Record<keyof DashboardNewsInput, string>>;

const ARGENTINA_UTC_OFFSET = "-03:00";
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export const buildNewsSlug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const toDatetimeLocalValue = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const parts = Object.fromEntries(
    dateParts.map(({ type, value: partValue }) => [type, partValue])
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const fromDatetimeLocalValue = (value: string): string => {
  const date = new Date(`${value}:00${ARGENTINA_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

export const validateDashboardNewsInput = (
  values: DashboardNewsInput
): DashboardNewsErrors => {
  const errors: DashboardNewsErrors = {};

  if (!values.title.trim()) {
    errors.title = "Escribí un título.";
  }

  if (!values.description.trim()) {
    errors.description = "Escribí una descripción.";
  }

  if (!values.slug.trim()) {
    errors.slug = "Escribí un slug.";
  }

  if (!values.date.trim() || Number.isNaN(new Date(values.date).getTime())) {
    errors.date = "Elegí una fecha válida.";
  }

  if (!values.imageAlt.trim()) {
    errors.imageAlt = "Escribí un texto alternativo.";
  }

  return errors;
};

export const validateDashboardNewsImageFile = (
  file?: Pick<File, "size" | "type"> | null
): string | null => {
  if (!file) {
    return null;
  }

  if (
    !DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES.includes(
      file.type as (typeof DASHBOARD_NEWS_IMAGE_ACCEPTED_TYPES)[number]
    )
  ) {
    return "La imagen debe ser JPG, PNG o WebP.";
  }

  if (file.size > DASHBOARD_NEWS_IMAGE_MAX_BYTES) {
    return "La imagen no puede superar 4 MB en producción.";
  }

  return null;
};

export const validateDashboardNewsImageDimensions = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): string | null => {
  const megapixels = (width * height) / 1_000_000;

  if (megapixels > DASHBOARD_NEWS_IMAGE_MAX_MEGAPIXELS) {
    return "La imagen supera el límite de 256 megapíxeles de Sanity.";
  }

  return null;
};
