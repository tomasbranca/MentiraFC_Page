import { describe, expect, it } from "vitest";

import {
  buildOffsetPaginatedResult,
  normalizePaginationCursor,
  normalizePaginationLimit,
  normalizePaginationPage,
  normalizeSearch,
  parseOffsetPaginationParams,
} from "./pagination";

const SORTS = ["date", "title"] as const;

describe("pagination helpers", () => {
  it("normaliza limites ausentes, invalidos y enormes", () => {
    expect(normalizePaginationLimit(undefined)).toBe(20);
    expect(normalizePaginationLimit("-1")).toBe(20);
    expect(normalizePaginationLimit("5000")).toBe(50);
    expect(normalizePaginationLimit("12")).toBe(12);
  });

  it("valida paginas positivas dentro del rango permitido", () => {
    expect(normalizePaginationPage(undefined)).toBe(1);
    expect(normalizePaginationPage("2")).toBe(2);
    expect(normalizePaginationPage("0")).toBeNull();
    expect(normalizePaginationPage("-2")).toBeNull();
    expect(normalizePaginationPage("1001", { maxPage: 1000 })).toBeNull();
  });

  it("valida cursores con un alfabeto acotado", () => {
    expect(normalizePaginationCursor("abc_DEF-123")).toBe("abc_DEF-123");
    expect(normalizePaginationCursor("../drafts.secret")).toBeNull();
    expect(normalizePaginationCursor("")).toBeNull();
  });

  it("recorta espacios de busqueda y rechaza valores enormes", () => {
    expect(normalizeSearch("  uno   dos  ")).toBe("uno dos");
    expect(normalizeSearch("x".repeat(81))).toBeNull();
  });

  it("parsea una pagina offset con sort whitelist y direccion validada", () => {
    const result = parseOffsetPaginationParams(
      new URLSearchParams("page=3&limit=500&sortBy=title&direction=asc"),
      {
        allowedSortBy: SORTS,
        defaultSortBy: "date",
      }
    );

    expect(result).toEqual({
      ok: true,
      params: {
        page: 3,
        limit: 50,
        offset: 100,
        sortBy: "title",
        direction: "asc",
        search: null,
      },
    });
  });

  it("rechaza sort, direction, page, cursor y search invalidos", () => {
    const result = parseOffsetPaginationParams(
      new URLSearchParams(
        `page=-1&sortBy=content&direction=random&cursor=bad/value&search=${"x".repeat(
          81
        )}`
      ),
      {
        allowedSortBy: SORTS,
        defaultSortBy: "date",
      }
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.map((issue) => issue.field)).toEqual([
        "page",
        "sortBy",
        "direction",
        "search",
        "cursor",
      ]);
    }
  });

  it("crea metadata consistente para paginas offset", () => {
    expect(
      buildOffsetPaginatedResult(["a", "b"], 42, { page: 2, limit: 20 })
    ).toEqual({
      items: ["a", "b"],
      total: 42,
      page: 2,
      limit: 20,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: true,
      nextCursor: null,
      previousCursor: null,
    });
  });
});
