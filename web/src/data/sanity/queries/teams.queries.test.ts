import { describe, expect, it } from "vitest";

import { TEAMS_QUERY } from "./teams.queries";

describe("teams queries", () => {
  it("excluye borradores del sitio publico", () => {
    expect(TEAMS_QUERY).toContain('!(_id in path("drafts.**"))');
  });
});
