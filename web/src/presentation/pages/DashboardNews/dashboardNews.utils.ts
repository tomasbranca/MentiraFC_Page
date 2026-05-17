import type { DashboardNewsInput } from "../../../types/dashboard";

export type DashboardNewsErrors = Partial<Record<keyof DashboardNewsInput, string>>;

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

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

export const fromDatetimeLocalValue = (value: string): string => {
  const date = new Date(value);
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
