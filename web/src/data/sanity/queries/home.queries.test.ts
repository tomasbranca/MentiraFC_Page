import { describe, expect, it } from "vitest";

import { HOME_CRITICAL_QUERY } from "./home.queries";

describe("home queries", () => {
  it("filtra borradores de las noticias publicas del inicio", () => {
    expect(HOME_CRITICAL_QUERY).toContain('!(_id in path("drafts.**"))');
  });
});
