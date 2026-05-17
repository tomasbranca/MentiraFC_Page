import type { DashboardNewsInput } from "../../../types/dashboard";

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

  return errors;
};
