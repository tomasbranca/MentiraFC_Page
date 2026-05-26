import { describe, expect, it } from "vitest";

import {
  buildCommentItemApiPath,
  buildCommentModerationApiPath,
  buildCommentReportApiPath,
  buildCommentReportStatusApiPath,
  getCommentReportReasonLabel,
} from "./comments";

describe("comments data helpers", () => {
  it("usa query params para evitar el fallback HTML de Vercel", () => {
    expect(buildCommentItemApiPath("comment-1")).toBe(
      "/api/comments?commentId=comment-1"
    );
    expect(
      buildCommentItemApiPath("comment-1", { asModerator: true })
    ).toBe("/api/comments?commentId=comment-1&as=moderator");
    expect(buildCommentReportApiPath("comment-1")).toBe(
      "/api/comments?commentId=comment-1&action=report"
    );
    expect(buildCommentModerationApiPath({ cursor: "next", limit: 10 })).toBe(
      "/api/comments?view=moderation&limit=10&cursor=next"
    );
    expect(buildCommentReportStatusApiPath("report-1")).toBe(
      "/api/comments?reportId=report-1"
    );
  });

  it("expone etiquetas de reporte en espanol", () => {
    expect(getCommentReportReasonLabel("spam")).toBe("Spam");
    expect(getCommentReportReasonLabel("harassment")).toBe("Acoso o insultos");
    expect(getCommentReportReasonLabel("off_topic")).toBe("Fuera de tema");
    expect(getCommentReportReasonLabel("other")).toBe("Otro");
  });
});
