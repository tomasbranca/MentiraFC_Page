import type { CommentModerationItem } from "../../../types/comments";

export const getVisibleOpenReportIds = (
  item: CommentModerationItem
): string[] =>
  item.reports
    .filter((report) => report.status === "open")
    .map((report) => report.id);

export const getReportCountLabel = (count: number): string =>
  count === 1 ? "1 reporte abierto" : `${count} reportes abiertos`;
