import { describe, expect, it } from "vitest";

import { PLAYER_BY_SLUG_OR_ID_QUERY, PLAYERS_QUERY } from "./players.queries";

describe("players queries", () => {
  it("busca el detalle por slug canonico o por id de documento", () => {
    expect(PLAYER_BY_SLUG_OR_ID_QUERY).toContain("coalesce(");
    expect(PLAYER_BY_SLUG_OR_ID_QUERY).toContain("slug.current == $slug");
    expect(PLAYER_BY_SLUG_OR_ID_QUERY).toContain("_id == $slug");
  });

  it("prioriza coincidencias por slug antes del fallback por id", () => {
    expect(PLAYER_BY_SLUG_OR_ID_QUERY.indexOf("slug.current == $slug")).toBeLessThan(
      PLAYER_BY_SLUG_OR_ID_QUERY.indexOf("_id == $slug")
    );
  });

  it("proyecta la pierna habil en listado y detalle", () => {
    expect(PLAYERS_QUERY).toContain("dominantFoot");
    expect(PLAYER_BY_SLUG_OR_ID_QUERY).toContain("dominantFoot");
  });

  it("proyecta las valoraciones del jugador en listado y detalle", () => {
    expect(PLAYERS_QUERY).toContain("fieldRatings");
    expect(PLAYERS_QUERY).toContain("goalkeeperRatings");
    expect(PLAYER_BY_SLUG_OR_ID_QUERY).toContain("fieldRatings");
    expect(PLAYER_BY_SLUG_OR_ID_QUERY).toContain("goalkeeperRatings");
  });

  it("excluye jugadores inactivos del listado publico", () => {
    expect(PLAYERS_QUERY).toContain("coalesce(isActive, true) == true");
  });
});
