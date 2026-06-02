import { describe, expect, it } from "vitest";

import {
  FALLBACK_NEWS_QUERY,
  NEWS_BY_SLUG_QUERY,
  NEWS_QUERY,
  SUGGESTED_NEWS_QUERY,
  getNewsPageQuery,
} from "./news.queries";

describe("news queries", () => {
  it("filtra borradores en todas las lecturas publicas", () => {
    const draftFilter = '!(_id in path("drafts.**"))';

    expect(NEWS_QUERY).toContain(draftFilter);
    expect(NEWS_BY_SLUG_QUERY).toContain(draftFilter);
    expect(SUGGESTED_NEWS_QUERY).toContain(draftFilter);
    expect(FALLBACK_NEWS_QUERY).toContain(draftFilter);
  });

  it("pagina noticias publicas sin traer Portable Text completo", () => {
    const query = getNewsPageQuery("date", "desc");

    expect(query).toContain("[$offset...$end]");
    expect(query).toContain('"total": count(');
    expect(query).toContain("!$hasSearch");
    expect(query).not.toContain("content[]");
  });
});
