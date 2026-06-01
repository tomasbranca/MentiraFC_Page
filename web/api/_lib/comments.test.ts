import { describe, expect, it } from "vitest";

import {
  decodeCommentCursor,
  encodeCommentCursor,
  isCommentReportReason,
  normalizeCommentBody,
  normalizeCommentLimit,
  normalizeCommentSort,
  normalizeNewsId,
  normalizeReportDetails,
} from "./comments";

describe("comments api helpers", () => {
  it("normaliza newsId validos y rechaza drafts", () => {
    expect(normalizeNewsId("news-abc")).toBe("news-abc");
    expect(normalizeNewsId("drafts.news-abc")).toBeNull();
    expect(normalizeNewsId("")).toBeNull();
  });

  it("normaliza body con trim y limite", () => {
    expect(normalizeCommentBody("  hola mundo  ")).toBe("hola mundo");
    expect(normalizeCommentBody("   ")).toBeNull();
    expect(normalizeCommentBody("a".repeat(2001))).toBeNull();
  });

  it("normaliza sort y limit", () => {
    expect(normalizeCommentSort("oldest")).toBe("oldest");
    expect(normalizeCommentSort("newest")).toBe("newest");
    expect(normalizeCommentSort("invalid")).toBe("newest");
    expect(normalizeCommentLimit("10")).toBe(10);
    expect(normalizeCommentLimit("999")).toBe(50);
    expect(normalizeCommentLimit(undefined)).toBe(20);
  });

  it("codifica y decodifica cursor estable", () => {
    const createdAt = "2026-05-25T12:00:00.000Z";
    const id = "11111111-1111-1111-1111-111111111111";
    const cursor = encodeCommentCursor(createdAt, id);

    expect(decodeCommentCursor(cursor)).toEqual({ createdAt, id });
    expect(decodeCommentCursor("invalid")).toBeNull();
  });

  it("rechaza cursores fabricados con fecha o id inseguros", () => {
    const unsafeCreatedAt = Buffer.from(
      "created_at.lt.2026-01-01|11111111-1111-1111-1111-111111111111",
      "utf8"
    ).toString("base64url");
    const unsafeId = Buffer.from(
      "2026-05-25T12:00:00.000Z|id.lt.anything",
      "utf8"
    ).toString("base64url");

    expect(decodeCommentCursor(unsafeCreatedAt)).toBeNull();
    expect(decodeCommentCursor(unsafeId)).toBeNull();
  });

  it("valida razones y detalles de reporte", () => {
    expect(isCommentReportReason("spam")).toBe(true);
    expect(isCommentReportReason("invalid")).toBe(false);
    expect(normalizeReportDetails(" detalle ")).toBe("detalle");
    expect(normalizeReportDetails("a".repeat(501))).toBeNull();
  });
});
