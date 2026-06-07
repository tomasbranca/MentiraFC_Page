import { describe, expect, it } from "vitest";

import { FINISHED_TOURNAMENT_GAMES_QUERY } from "./games.queries";
import { TOURNAMENT_QUERY } from "./tournaments.queries";

describe("standings Sanity queries", () => {
  it("lee solo snapshots current y previous para la tabla publica", () => {
    expect(TOURNAMENT_QUERY).toContain('snapshotRole in ["current", "previous"]');
    expect(TOURNAMENT_QUERY).toContain("order(snapshotRole asc)");
    expect(TOURNAMENT_QUERY).toContain("points,");
    expect(TOURNAMENT_QUERY).toContain("goalDiff,");
    expect(TOURNAMENT_QUERY).not.toContain('"points": coalesce');
    expect(TOURNAMENT_QUERY).not.toContain('"goalDiff": coalesce');
    expect(TOURNAMENT_QUERY).not.toContain(
      "order(matchdayNumber desc, snapshotDate desc, _updatedAt desc)[0...2]"
    );
  });

  it("consulta partidos de torneo por referencia y no por label de competencia", () => {
    expect(FINISHED_TOURNAMENT_GAMES_QUERY).toContain(
      "defined(tournament._ref)"
    );
    expect(FINISHED_TOURNAMENT_GAMES_QUERY).not.toContain(
      'competition == "Torneo"'
    );
  });
});
