import { describe, expect, it } from "vitest";

import type { CommentModerationItem } from "../../../types/comments";
import {
  getReportCountLabel,
  getVisibleOpenReportIds,
} from "./adminCommentReports.utils";

const createModerationItem = (
  reports: CommentModerationItem["reports"]
): CommentModerationItem => ({
  comment: {
    id: "11111111-1111-4111-8111-111111111111",
    newsId: "news-1",
    body: "Comentario reportado",
    createdAt: "2026-05-26T10:00:00.000Z",
    updatedAt: "2026-05-26T10:00:00.000Z",
    editedAt: null,
    author: {
      id: "22222222-2222-4222-8222-222222222222",
      firstName: "Tomas",
      lastName: "Perez",
    },
    canEdit: false,
    canDelete: false,
    canModerateDelete: true,
  },
  openReportCount: reports.filter((report) => report.status === "open").length,
  reports,
});

describe("admin comment reports utils", () => {
  it("selecciona todos los reportes visibles abiertos para cerrar al eliminar", () => {
    const item = createModerationItem([
      {
        id: "33333333-3333-4333-8333-333333333333",
        reason: "spam",
        details: null,
        createdAt: "2026-05-26T10:05:00.000Z",
        status: "open",
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        reason: "harassment",
        details: "Insulto",
        createdAt: "2026-05-26T10:06:00.000Z",
        status: "open",
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        reason: "other",
        details: null,
        createdAt: "2026-05-26T10:07:00.000Z",
        status: "dismissed",
      },
    ]);

    expect(getVisibleOpenReportIds(item)).toEqual([
      "33333333-3333-4333-8333-333333333333",
      "44444444-4444-4444-8444-444444444444",
    ]);
  });

  it("formatea el contador de reportes abiertos", () => {
    expect(getReportCountLabel(1)).toBe("1 reporte abierto");
    expect(getReportCountLabel(3)).toBe("3 reportes abiertos");
  });
});
