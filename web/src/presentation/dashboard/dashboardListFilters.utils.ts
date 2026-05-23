export type DashboardDocumentStatusFilter = "all" | "published" | "draft";

export const DASHBOARD_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: DashboardDocumentStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Todos los estados" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Borradores" },
];

export const normalizeDashboardFilterText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

export const matchesDashboardSearchQuery = (
  query: string,
  parts: Array<string | number | null | undefined>
): boolean => {
  const normalizedQuery = normalizeDashboardFilterText(query);

  if (!normalizedQuery) {
    return true;
  }

  const haystack = normalizeDashboardFilterText(
    parts.map((part) => String(part ?? "")).join(" ")
  );

  return haystack.includes(normalizedQuery);
};

export const matchesDashboardStatusFilter = (
  status: "published" | "draft",
  filter: DashboardDocumentStatusFilter
): boolean => filter === "all" || status === filter;
