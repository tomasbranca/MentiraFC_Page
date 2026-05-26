import { describe, expect, it } from "vitest";

import { getCommentReportReasonLabel } from "./comments";

describe("comments data helpers", () => {
  it("expone etiquetas de reporte en espanol", () => {
    expect(getCommentReportReasonLabel("spam")).toBe("Spam");
    expect(getCommentReportReasonLabel("harassment")).toBe("Acoso o insultos");
    expect(getCommentReportReasonLabel("off_topic")).toBe("Fuera de tema");
    expect(getCommentReportReasonLabel("other")).toBe("Otro");
  });
});
