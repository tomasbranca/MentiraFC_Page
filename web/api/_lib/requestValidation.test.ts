import { describe, expect, it } from "vitest";

import {
  hasExcessiveContentLength,
  normalizeOptionalSanityDocumentId,
  normalizeSanityDocumentId,
  normalizeUuid,
} from "./requestValidation";

describe("request validation helpers", () => {
  it("acepta uuids y rechaza intentos SQL-like", () => {
    expect(normalizeUuid("11111111-1111-1111-1111-111111111111")).toBe(
      "11111111-1111-1111-1111-111111111111"
    );
    expect(normalizeUuid("' OR 1=1 --")).toBeNull();
    expect(normalizeUuid("11111111-1111-1111-1111-111111111111;drop")).toBeNull();
  });

  it("acepta ids Sanity seguros y rechaza comillas, corchetes u operadores", () => {
    expect(normalizeSanityDocumentId("news.11111111-1111")).toBe(
      "news.11111111-1111"
    );
    expect(normalizeSanityDocumentId("drafts.news.1")).toBeNull();
    expect(
      normalizeSanityDocumentId("drafts.news.1", { allowDrafts: true })
    ).toBe("drafts.news.1");
    expect(normalizeSanityDocumentId('news"] | *[_type=="secret"]')).toBeNull();
    expect(normalizeSanityDocumentId("news[0]")).toBeNull();
    expect(normalizeSanityDocumentId("news..hidden")).toBeNull();
  });

  it("marca ids opcionales invalidos sin convertir ausencia en error", () => {
    expect(normalizeOptionalSanityDocumentId(null)).toEqual({
      invalid: false,
      value: null,
    });
    expect(normalizeOptionalSanityDocumentId("")).toEqual({
      invalid: false,
      value: null,
    });
    expect(normalizeOptionalSanityDocumentId("bad id")).toEqual({
      invalid: true,
      value: null,
    });
  });

  it("limita ids Sanity excesivos", () => {
    expect(normalizeSanityDocumentId("n".repeat(257))).toBeNull();
  });

  it("detecta payloads con content-length excesivo", () => {
    const request = new Request("https://mentirafc.vercel.app/api/comments", {
      method: "POST",
      headers: {
        "content-length": "10001",
      },
    });

    expect(hasExcessiveContentLength(request, 10_000)).toBe(true);
  });
});
