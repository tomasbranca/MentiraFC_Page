import { describe, expect, it } from "vitest";

import { createCanonicalMatchId, getPublicMatchId } from "./repository.js";

describe("dashboard matches repository", () => {
  it("crea ids publicos para que los partidos aparezcan en consultas sin token", () => {
    const id = createCanonicalMatchId();

    expect(id).toMatch(/^games-[0-9a-f-]+$/);
    expect(id).not.toContain(".");
  });

  it("convierte ids privados historicos a ids publicos al publicar", () => {
    expect(getPublicMatchId("games.71b76489-bbea-417f-9421-726cb24f30c8")).toBe(
      "games-71b76489-bbea-417f-9421-726cb24f30c8"
    );
    expect(
      getPublicMatchId("drafts.games.71b76489-bbea-417f-9421-726cb24f30c8")
    ).toBe("games-71b76489-bbea-417f-9421-726cb24f30c8");
    expect(getPublicMatchId("75d03b9a-4a0c-4812-8e0d-6c9135b00f99")).toBe(
      "75d03b9a-4a0c-4812-8e0d-6c9135b00f99"
    );
  });
});
