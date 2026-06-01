import { describe, expect, it } from "vitest";

import {
  normalizeSanitySlugOrPublicIdParam,
  normalizeSanitySlugParam,
} from "./requestParams";

describe("Sanity request params", () => {
  it("acepta slugs canonicos", () => {
    expect(normalizeSanitySlugParam("victoria-importante")).toBe(
      "victoria-importante"
    );
  });

  it("rechaza slugs con payloads GROQ-like", () => {
    expect(normalizeSanitySlugParam("' OR 1=1 --")).toBeNull();
    expect(normalizeSanitySlugParam('nota"] | *[_type=="secret"]')).toBeNull();
    expect(normalizeSanitySlugParam("nota[0]")).toBeNull();
  });

  it("permite fallback por id publico para jugadores y staff", () => {
    expect(normalizeSanitySlugOrPublicIdParam("players.abc-123")).toBe(
      "players.abc-123"
    );
    expect(normalizeSanitySlugOrPublicIdParam("drafts.players.abc")).toBeNull();
  });

  it("limita parametros excesivos", () => {
    expect(normalizeSanitySlugParam("a".repeat(257))).toBeNull();
    expect(normalizeSanitySlugOrPublicIdParam("players." + "a".repeat(257))).toBeNull();
  });
});
