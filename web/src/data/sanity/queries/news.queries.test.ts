import { describe, expect, it } from "vitest";

import {
  FALLBACK_NEWS_QUERY,
  NEWS_BY_SLUG_QUERY,
  NEWS_QUERY,
  SUGGESTED_NEWS_QUERY,
} from "./news.queries";

describe("news queries", () => {
  it("filtra borradores en todas las lecturas publicas", () => {
    const draftFilter = '!(_id in path("drafts.**"))';

    expect(NEWS_QUERY).toContain(draftFilter);
    expect(NEWS_BY_SLUG_QUERY).toContain(draftFilter);
    expect(SUGGESTED_NEWS_QUERY).toContain(draftFilter);
    expect(FALLBACK_NEWS_QUERY).toContain(draftFilter);
  });
});
